using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/leaderboard")]
[AllowAnonymous]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly ICurrencyService _currencyService;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        ICurrencyService currencyService)
    {
        _leaderboardService = leaderboardService;
        _currencyService = currencyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int limit = 100, CancellationToken cancellationToken = default)
    {
        if (limit < 1) limit = 1;
        if (limit > 500) limit = 500;

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
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