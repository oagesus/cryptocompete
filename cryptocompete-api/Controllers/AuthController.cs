using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
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

        var accessToken = _jwtService.GenerateAccessToken(user);
        var (refreshToken, refreshTokenHash) = _jwtService.GenerateRefreshToken();

        var deviceInfo = Request.Headers.UserAgent.ToString();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_refreshTokenExpirationDays),
            DeviceInfo = deviceInfo.Length > 500 ? deviceInfo[..500] : deviceInfo
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

        var user = await _db.Users.FindAsync(userId);

        if (user == null)
        {
            return Unauthorized(new { message = "User not found" });
        }

        if (user.IsBlocked)
        {
            DeleteTokenCookies();
            return Unauthorized(new { message = "Your account has been blocked" });
        }

        return Ok(new MeResponse(user.Id, user.Username, user.Email));
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
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        if (storedToken == null)
        {
            return Unauthorized(new { message = "Invalid refresh token" });
        }

        if (storedToken.RevokedAt != null)
        {
            await RevokeAllUserTokens(storedToken.UserId);
            return Unauthorized(new { message = "Token has been revoked" });
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

        storedToken.RevokedAt = DateTimeOffset.UtcNow;

        var accessToken = _jwtService.GenerateAccessToken(storedToken.User);
        var (newRefreshToken, newRefreshTokenHash) = _jwtService.GenerateRefreshToken();

        var newRefreshTokenEntity = new RefreshToken
        {
            UserId = storedToken.UserId,
            TokenHash = newRefreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_refreshTokenExpirationDays),
            DeviceInfo = storedToken.DeviceInfo
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
            var storedToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (storedToken != null)
            {
                storedToken.RevokedAt = DateTimeOffset.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        DeleteTokenCookies();

        return Ok(new { message = "Logged out successfully" });
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
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}

public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Identifier, string Password);
public record LoginResponse(string AccessToken, string RefreshToken, int UserId, string Username, string Email);
public record RefreshResponse(string AccessToken, string RefreshToken);
public record MeResponse(int Id, string Username, string Email);