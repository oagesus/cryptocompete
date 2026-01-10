using System.Security.Claims;
using CryptoCompete.Api.Constants;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    [Authorize(Roles = "Premium,Admin")]
    public async Task<IActionResult> CreateProfile([FromBody] CreateProfileRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var profileCount = await _db.Profiles.CountAsync(p => p.UserId == userId);
        if (profileCount >= ProfileLimits.Premium)
        {
            return BadRequest(new { message = $"Maximum of {ProfileLimits.Premium} profiles allowed" });
        }

        var usernameExists = await _db.Profiles.AnyAsync(p => p.Username == request.Username);
        if (usernameExists)
        {
            return BadRequest(new { message = "Username is already taken" });
        }

        var profile = new Profile
        {
            UserId = userId,
            Username = request.Username,
            IsMain = false
        };

        _db.Profiles.Add(profile);
        await _db.SaveChangesAsync();

        return Ok(new CreateProfileResponse(profile.PublicId, profile.Username));
    }

    [HttpPatch("{publicId}/activate")]
    public async Task<IActionResult> ActivateProfile(Guid publicId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var profile = await _db.Profiles
            .FirstOrDefaultAsync(p => p.PublicId == publicId && p.UserId == userId);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        user.ActiveProfileId = profile.Id;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record CreateProfileRequest(string Username);
public record CreateProfileResponse(Guid PublicId, string Username);