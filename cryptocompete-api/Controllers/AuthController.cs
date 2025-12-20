using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly string _frontendUrl;

    public AuthController(AppDbContext db, IEmailService emailService, IConfiguration configuration)
    {
        _db = db;
        _emailService = emailService;
        _frontendUrl = configuration["FrontendUrl"] 
            ?? throw new InvalidOperationException("FrontendUrl is not configured");
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
}

public record RegisterRequest(string Username, string Email, string Password);