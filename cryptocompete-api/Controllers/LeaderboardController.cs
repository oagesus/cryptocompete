using System.Security.Claims;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/leaderboard")]
[AllowAnonymous]
public class LeaderboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILeaderboardService _leaderboardService;
    private readonly ICurrencyService _currencyService;

    public LeaderboardController(
        AppDbContext db,
        ILeaderboardService leaderboardService,
        ICurrencyService currencyService)
    {
        _db = db;
        _leaderboardService = leaderboardService;
        _currencyService = currencyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int limit = 100, CancellationToken cancellationToken = default)
    {
        if (limit < 1) limit = 1;
        if (limit > 500) limit = 500;

        var displayCurrency = "EUR";
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                displayCurrency = user.DisplayCurrency;
            }
        }

        var exchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);
        var entries = await _leaderboardService.GetLeaderboardAsync(limit, cancellationToken);

        var response = entries.Select(e => new LeaderboardEntryDto(
            e.Rank,
            e.ProfilePublicId,
            e.Username,
            e.TotalValue,
            e.CalculatedAt
        )).ToList();

        return Ok(new LeaderboardResponse(response, displayCurrency, exchangeRate));
    }
}

public record LeaderboardEntryDto(
    int Rank,
    Guid ProfilePublicId,
    string Username,
    decimal TotalValue,
    DateTimeOffset CalculatedAt
);

public record LeaderboardResponse(
    List<LeaderboardEntryDto> Entries,
    string Currency,
    decimal ExchangeRate
);