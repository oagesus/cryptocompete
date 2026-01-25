using System.Globalization;
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
    private const int UsernameChangeCooldownDays = 30;

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

    [HttpPatch("{publicId}/username")]
    public async Task<IActionResult> ChangeUsername(Guid publicId, [FromBody] ChangeUsernameRequest request)
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

        if (profile.Username == request.Username)
        {
            return BadRequest(new { message = "New username must be different from current username" });
        }

        var lastChange = await _db.UsernameHistories
            .Where(h => h.ProfileId == profile.Id)
            .OrderByDescending(h => h.ChangedAt)
            .FirstOrDefaultAsync();

        if (lastChange != null)
        {
            var nextChangeDate = lastChange.ChangedAt.AddDays(UsernameChangeCooldownDays);
            if (DateTimeOffset.UtcNow < nextChangeDate)
            {
                var isoDate = nextChangeDate.UtcDateTime.ToString("o");
                return BadRequest(new { message = "USERNAME_CHANGE_COOLDOWN", nextChangeDate = isoDate });
            }
        }

        var usernameExists = await _db.Profiles.AnyAsync(p => p.Username == request.Username);
        if (usernameExists)
        {
            return BadRequest(new { message = "Username is already taken" });
        }

        var history = new UsernameHistory
        {
            ProfileId = profile.Id,
            Username = profile.Username,
            ChangedAt = DateTimeOffset.UtcNow
        };

        _db.UsernameHistories.Add(history);
        profile.Username = request.Username;

        await _db.SaveChangesAsync();

        return Ok(new ChangeUsernameResponse(profile.PublicId, profile.Username));
    }

    [HttpGet("{publicId}/username-history")]
    public async Task<IActionResult> GetUsernameHistory(Guid publicId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var profile = await _db.Profiles
            .Include(p => p.UsernameHistories)
            .FirstOrDefaultAsync(p => p.PublicId == publicId && p.UserId == userId);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var history = profile.UsernameHistories
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new UsernameHistoryDto(h.Username, h.ChangedAt))
            .ToList();

        var lastChangeAt = history.FirstOrDefault()?.ChangedAt;
        var isInitialUsername = !history.Any();

        return Ok(new UsernameHistoryResponse(
            profile.Username, 
            isInitialUsername, 
            lastChangeAt,
            history
        ));
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
public record ChangeUsernameRequest(string Username);
public record ChangeUsernameResponse(Guid PublicId, string Username);
public record UsernameHistoryDto(string Username, DateTimeOffset ChangedAt);
public record UsernameHistoryResponse(string CurrentUsername, bool IsInitialUsername, DateTimeOffset? UsernameChangedAt, List<UsernameHistoryDto> History);