using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly string _frontendUrl;

    public AuthController(IEmailService emailService, IConfiguration configuration)
    {
        _emailService = emailService;
        _frontendUrl = configuration["FrontendUrl"] 
            ?? throw new InvalidOperationException("FrontendUrl is not configured");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // TODO: save user in db and generate token
        var token = "test123";
        var verificationLink = $"{_frontendUrl}/verify?token={token}";

        await _emailService.SendVerificationEmailAsync(
            request.Email,
            request.Username,
            verificationLink
        );

        return Ok(new { message = "Verification email sent" });
    }
}

public record RegisterRequest(string Username, string Email, string Password);