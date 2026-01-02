using System.Security.Claims;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IJwtService _jwtService;
    private readonly string _frontendUrl;
    private readonly int _refreshTokenExpirationDays;
    private readonly int _accessTokenExpirationMinutes;
    private readonly bool _isProduction;
    private readonly string _googleClientId;

    public AuthController(
        AppDbContext db, 
        IEmailService emailService, 
        IJwtService jwtService,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _db = db;
        _emailService = emailService;
        _jwtService = jwtService;
        _frontendUrl = configuration["FrontendUrl"] 
            ?? throw new InvalidOperationException("FrontendUrl is not configured");
        _refreshTokenExpirationDays = configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays", 30);
        _accessTokenExpirationMinutes = configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 5);
        _isProduction = environment.IsProduction();
        _googleClientId = configuration["Google:ClientId"] 
            ?? throw new InvalidOperationException("Google:ClientId is not configured");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var existingUserByEmail = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existingUserByEmail != null && existingUserByEmail.EmailVerifiedAt != null)
        {
            return BadRequest(new { message = "Email is already registered" });
        }

        var existingUserByUsername = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (existingUserByUsername != null && existingUserByUsername.EmailVerifiedAt != null)
        {
            return BadRequest(new { message = "Username is already taken" });
        }

        if (existingUserByUsername != null && existingUserByUsername.Email != request.Email)
        {
            return BadRequest(new { message = "Username is already taken" });
        }

        if (existingUserByEmail != null)
        {
            var lastToken = await _db.EmailVerificationTokens
                .Where(t => t.UserId == existingUserByEmail.Id)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastToken != null && lastToken.CreatedAt > DateTimeOffset.UtcNow.AddSeconds(-60))
            {
                var secondsRemaining = (int)(60 - (DateTimeOffset.UtcNow - lastToken.CreatedAt).TotalSeconds);
                return BadRequest(new { message = $"Please wait {secondsRemaining} seconds before requesting another email" });
            }

            _db.Users.Remove(existingUserByEmail);
            await _db.SaveChangesAsync();
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var verificationToken = new EmailVerificationToken
        {
            UserId = user.Id
        };

        _db.EmailVerificationTokens.Add(verificationToken);
        await _db.SaveChangesAsync();

        var link = $"{_frontendUrl}/auth/verify?token={verificationToken.Token}";

        await _emailService.SendVerificationEmailAsync(
            user.Email,
            user.Username,
            link
        );

        return Ok(new { message = "Verification email sent" });
    }

    [HttpGet("verify")]
    public async Task<IActionResult> Verify([FromQuery] Guid token)
    {
        var verificationToken = await _db.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token);

        if (verificationToken == null)
        {
            return BadRequest(new { message = "Invalid verification token" });
        }

        if (verificationToken.IsUsed)
        {
            return BadRequest(new { message = "Token has already been used" });
        }

        if (verificationToken.ExpiresAt < DateTimeOffset.UtcNow)
        {
            return BadRequest(new { message = "Token has expired" });
        }

        verificationToken.IsUsed = true;
        verificationToken.User.EmailVerifiedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Email verified successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => 
            u.Email == request.Identifier || u.Username == request.Identifier);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            var providers = await _db.ExternalLogins
                .Where(e => e.UserId == user.Id)
                .Select(e => e.Provider)
                .ToListAsync();

            var providerList = string.Join(" or ", providers);
            return Unauthorized(new { message = $"Please sign in with {providerList}" });
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        if (user.EmailVerifiedAt == null)
        {
            return Unauthorized(new { message = "Please verify your email before logging in" });
        }

        if (user.IsBlocked)
        {
            return Unauthorized(new { message = "Your account has been blocked" });
        }

        return await CreateSessionAndRespond(user);
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        GoogleJsonWebSignature.Payload payload;
        
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _googleClientId }
            };
            
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { message = "Invalid Google token" });
        }

        if (!payload.EmailVerified)
        {
            return BadRequest(new { message = "Google email is not verified" });
        }

        var externalLogin = await _db.ExternalLogins
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => 
                e.Provider == ExternalLoginProviders.Google && 
                e.ProviderSubjectId == payload.Subject);

        User? user;

        if (externalLogin != null)
        {
            user = externalLogin.User;
        }
        else
        {
            user = await _db.Users
                .Include(u => u.ExternalLogins)
                .FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user != null)
            {
                if (user.EmailVerifiedAt == null)
                {
                    user.EmailVerifiedAt = DateTimeOffset.UtcNow;
                }

                var newExternalLogin = new ExternalLogin
                {
                    UserId = user.Id,
                    Provider = ExternalLoginProviders.Google,
                    ProviderSubjectId = payload.Subject,
                    ProviderEmail = payload.Email,
                    ProviderDisplayName = payload.Name
                };

                _db.ExternalLogins.Add(newExternalLogin);
                await _db.SaveChangesAsync();
            }
            else
            {
                var username = await GenerateUniqueUsername(payload.Email);

                user = new User
                {
                    Username = username,
                    Email = payload.Email,
                    PasswordHash = null,
                    EmailVerifiedAt = DateTimeOffset.UtcNow
                };

                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                var newExternalLogin = new ExternalLogin
                {
                    UserId = user.Id,
                    Provider = ExternalLoginProviders.Google,
                    ProviderSubjectId = payload.Subject,
                    ProviderEmail = payload.Email,
                    ProviderDisplayName = payload.Name
                };

                _db.ExternalLogins.Add(newExternalLogin);
                await _db.SaveChangesAsync();
            }
        }

        if (user is null)
        {
            return BadRequest(new { message = "User could not be created" });
        }

        if (user.IsBlocked)
        {
            return Unauthorized(new { message = "Your account has been blocked" });
        }

        return await CreateSessionAndRespond(user);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid token" });
        }

        var user = await _db.Users
            .Include(u => u.ExternalLogins)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return Unauthorized(new { message = "User not found" });
        }

        if (user.IsBlocked)
        {
            DeleteTokenCookies();
            return Unauthorized(new { message = "Your account has been blocked" });
        }

        return Ok(new MeResponse(
            user.Id, 
            user.Username, 
            user.Email,
            user.PasswordHash != null,
            user.ExternalLogins.Select(e => e.Provider).ToList()
        ));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refresh_token"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "Refresh token is required" });
        }

        var tokenHash = JwtService.HashToken(refreshToken);

        var storedToken = await _db.RefreshTokens
            .Include(t => t.User)
            .Include(t => t.Session)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        if (storedToken == null)
        {
            return Unauthorized(new { message = "Invalid refresh token" });
        }

        if (storedToken.ExpiresAt < DateTimeOffset.UtcNow)
        {
            return Unauthorized(new { message = "Refresh token has expired" });
        }

        if (storedToken.User.IsBlocked)
        {
            await RevokeAllUserTokens(storedToken.UserId);
            DeleteTokenCookies();
            return Unauthorized(new { message = "Your account has been blocked" });
        }

        storedToken.Session.LastActivityAt = DateTimeOffset.UtcNow;

        _db.RefreshTokens.Remove(storedToken);

        var accessToken = _jwtService.GenerateAccessToken(storedToken.User);
        var (newRefreshToken, newRefreshTokenHash) = _jwtService.GenerateRefreshToken();

        var newRefreshTokenEntity = new RefreshToken
        {
            UserId = storedToken.UserId,
            SessionId = storedToken.SessionId,
            TokenHash = newRefreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_refreshTokenExpirationDays)
        };

        _db.RefreshTokens.Add(newRefreshTokenEntity);
        await _db.SaveChangesAsync();

        SetTokenCookies(accessToken, newRefreshToken);

        return Ok(new RefreshResponse(accessToken, newRefreshToken));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refresh_token"];

        if (!string.IsNullOrEmpty(refreshToken))
        {
            var tokenHash = JwtService.HashToken(refreshToken);
            var storedToken = await _db.RefreshTokens
                .Include(t => t.Session)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (storedToken != null)
            {
                storedToken.Session.LoggedOutAt = DateTimeOffset.UtcNow;
                _db.RefreshTokens.Remove(storedToken);
                await _db.SaveChangesAsync();
            }
        }

        DeleteTokenCookies();

        return Ok(new { message = "Logged out successfully" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user != null && !user.IsBlocked)
        {
            var lastToken = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastToken == null || lastToken.CreatedAt <= DateTimeOffset.UtcNow.AddSeconds(-60))
            {
                var unusedTokens = await _db.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && !t.IsUsed)
                    .ToListAsync();

                _db.PasswordResetTokens.RemoveRange(unusedTokens);

                var resetToken = new PasswordResetToken
                {
                    UserId = user.Id
                };

                _db.PasswordResetTokens.Add(resetToken);
                await _db.SaveChangesAsync();

                var link = $"{_frontendUrl}/auth/reset-password?token={resetToken.Token}";

                await _emailService.SendPasswordResetEmailAsync(
                    user.Email,
                    user.Username,
                    link
                );
            }
        }

        return Ok(new { message = "If an account with this email exists, you will receive a password reset link." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!Guid.TryParse(request.Token, out var tokenGuid))
        {
            return BadRequest(new { message = "Invalid reset token" });
        }

        var resetToken = await _db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == tokenGuid);

        if (resetToken == null)
        {
            return BadRequest(new { message = "Invalid reset token" });
        }

        if (resetToken.IsUsed)
        {
            return BadRequest(new { message = "Token has already been used" });
        }

        if (resetToken.ExpiresAt < DateTimeOffset.UtcNow)
        {
            return BadRequest(new { message = "Token has expired" });
        }

        if (resetToken.User.IsBlocked)
        {
            return BadRequest(new { message = "Account is blocked" });
        }

        resetToken.IsUsed = true;
        resetToken.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        await RevokeAllUserTokens(resetToken.UserId);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Password reset successfully" });
    }

    private async Task<IActionResult> CreateSessionAndRespond(User user)
    {
        var accessToken = _jwtService.GenerateAccessToken(user);
        var (refreshToken, refreshTokenHash) = _jwtService.GenerateRefreshToken();

        var deviceInfo = Request.Headers.UserAgent.ToString();
        deviceInfo = deviceInfo.Length > 500 ? deviceInfo[..500] : deviceInfo;

        var session = new UserSession
        {
            UserId = user.Id,
            DeviceInfo = deviceInfo
        };

        _db.UserSessions.Add(session);
        await _db.SaveChangesAsync();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            SessionId = session.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_refreshTokenExpirationDays)
        };

        _db.RefreshTokens.Add(refreshTokenEntity);
        await _db.SaveChangesAsync();

        SetTokenCookies(accessToken, refreshToken);

        return Ok(new LoginResponse(
            accessToken,
            refreshToken,
            user.Id,
            user.Username,
            user.Email
        ));
    }

    private async Task<string> GenerateUniqueUsername(string email)
    {
        var baseUsername = email.Split('@')[0].ToLowerInvariant();

        baseUsername = new string(baseUsername.Select(c => char.IsLetterOrDigit(c) ? c : '_').ToArray());

        if (baseUsername.Length > 17)
        {
            baseUsername = baseUsername[..17];
        }

        var existingUsernames = await _db.Users
            .Where(u => u.Username.StartsWith(baseUsername))
            .Select(u => u.Username)
            .ToListAsync();

        var existingSet = existingUsernames.ToHashSet();

        if (baseUsername.Length < 3)
        {
            var usedNumbers = existingSet
                .Where(u => u.Length > baseUsername.Length)
                .Select(u => u[baseUsername.Length..])
                .Where(suffix => int.TryParse(suffix, out _))
                .Select(suffix => int.Parse(suffix))
                .ToHashSet();

            var availableNumbers = Enumerable.Range(100, 900)
                .Where(n => !usedNumbers.Contains(n))
                .ToList();

            if (availableNumbers.Count > 0)
            {
                var randomNumber = availableNumbers[Random.Shared.Next(availableNumbers.Count)];
                return $"{baseUsername}{randomNumber}";
            }
        }
        else
        {
            if (!existingSet.Contains(baseUsername))
            {
                return baseUsername;
            }

            var usedNumbersForBase = existingSet
                .Where(u => u.Length > baseUsername.Length)
                .Select(u => u[baseUsername.Length..])
                .Where(suffix => int.TryParse(suffix, out _))
                .Select(suffix => int.Parse(suffix))
                .ToHashSet();

            var availableNumbersForBase = Enumerable.Range(1, 999)
                .Where(n => !usedNumbersForBase.Contains(n))
                .ToList();

            if (availableNumbersForBase.Count > 0)
            {
                var randomNum = availableNumbersForBase[Random.Shared.Next(availableNumbersForBase.Count)];
                return $"{baseUsername}{randomNum}";
            }
        }

        var fallbackUsernames = await _db.Users
            .Where(u => u.Username.StartsWith("user"))
            .Select(u => u.Username)
            .ToListAsync();

        var fallbackSet = fallbackUsernames.ToHashSet();

        var usedFallbackNumbers = fallbackSet
            .Where(u => u.Length > 4)
            .Select(u => u[4..])
            .Where(suffix => int.TryParse(suffix, out _))
            .Select(suffix => int.Parse(suffix))
            .ToHashSet();

        var availableFallbackNumbers = Enumerable.Range(1, 999999)
            .Where(n => !usedFallbackNumbers.Contains(n))
            .ToList();

        var fallbackNumber = availableFallbackNumbers[Random.Shared.Next(availableFallbackNumbers.Count)];
        return $"user{fallbackNumber}";
    }

    private void SetTokenCookies(string accessToken, string refreshToken)
    {
        var tokenExpiration = DateTimeOffset.UtcNow.AddMinutes(_accessTokenExpirationMinutes).ToUnixTimeSeconds();

        Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = _isProduction,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(_accessTokenExpirationMinutes)
        });

        Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = _isProduction,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(_refreshTokenExpirationDays)
        });

        Response.Cookies.Append("token_exp", tokenExpiration.ToString(), new CookieOptions
        {
            HttpOnly = false,
            Secure = _isProduction,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(_accessTokenExpirationMinutes)
        });
    }

    private void DeleteTokenCookies()
    {
        Response.Cookies.Delete("access_token", new CookieOptions { Path = "/" });
        Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/" });
        Response.Cookies.Delete("token_exp", new CookieOptions { Path = "/" });
    }

    private async Task RevokeAllUserTokens(int userId)
    {
        var tokens = await _db.RefreshTokens
            .Include(t => t.Session)
            .Where(t => t.UserId == userId)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.Session.LoggedOutAt = DateTimeOffset.UtcNow;
        }

        _db.RefreshTokens.RemoveRange(tokens);

        await _db.SaveChangesAsync();
    }
}

public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Identifier, string Password);
public record GoogleLoginRequest(string IdToken);
public record LoginResponse(string AccessToken, string RefreshToken, int UserId, string Username, string Email);
public record RefreshResponse(string AccessToken, string RefreshToken);
public record MeResponse(int Id, string Username, string Email, bool HasPassword, List<string> ConnectedProviders);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string Password);