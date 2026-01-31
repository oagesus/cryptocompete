using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
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
    private readonly ILeaderboardService _leaderboardService;
    private readonly ICurrencyService _currencyService;
    private readonly AppDbContext _db;
    private readonly CryptoPriceBackgroundService _priceService;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        ICurrencyService currencyService,
        AppDbContext db,
        CryptoPriceBackgroundService priceService)
    {
        _leaderboardService = leaderboardService;
        _currencyService = currencyService;
        _db = db;
        _priceService = priceService;
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

    [HttpGet("profile/{username}")]
    public async Task<IActionResult> GetPublicProfile(string username, CancellationToken cancellationToken = default)
    {
        var profile = await _db.Profiles
            .Include(p => p.Holdings)
                .ThenInclude(h => h.Cryptocurrency)
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => EF.Functions.ILike(p.Username, username), cancellationToken);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
        var exchangeRate = await _currencyService.GetExchangeRateAsync("USD", displayCurrency);
        var balanceExchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);
        var convertedBalance = profile.Balance * balanceExchangeRate;

        var leaderboardEntry = await _leaderboardService.GetEntryByProfileIdAsync(profile.Id, cancellationToken);

        var holdings = profile.Holdings
            .Where(h => h.Amount > 0)
            .Select(h =>
            {
                var priceUsd = _priceService.GetPrice(h.Cryptocurrency.Symbol);
                var changePercent = _priceService.GetChangePercent24h(h.Cryptocurrency.Symbol);
                var investedValue = CalculateInvestedValue(profile.Transactions, h.CryptocurrencyId, balanceExchangeRate);

                return new PublicHoldingDto(
                    h.Cryptocurrency.Symbol,
                    h.Cryptocurrency.Name,
                    h.Amount,
                    priceUsd,
                    changePercent,
                    h.Cryptocurrency.Rank,
                    investedValue
                );
            })
            .ToList();

        return Ok(new PublicProfileResponse(
            profile.PublicId,
            profile.Username,
            leaderboardEntry?.Rank,
            convertedBalance,
            displayCurrency,
            exchangeRate,
            holdings
        ));
    }

    private decimal CalculateInvestedValue(ICollection<Transaction> transactions, int cryptoId, decimal exchangeRate)
    {
        var cryptoTransactions = transactions
            .Where(t => t.CryptocurrencyId == cryptoId)
            .OrderBy(t => t.CreatedAt)
            .ToList();

        decimal totalAmount = 0;
        decimal investedValue = 0;

        foreach (var transaction in cryptoTransactions)
        {
            if (transaction.Type == TransactionType.Buy)
            {
                totalAmount += transaction.Amount;
                investedValue += transaction.TotalValue;
            }
            else if (transaction.Type == TransactionType.Sell)
            {
                if (totalAmount > 0)
                {
                    var sellRatio = transaction.Amount / totalAmount;
                    investedValue -= investedValue * sellRatio;
                    totalAmount -= transaction.Amount;
                }

                if (totalAmount <= 0)
                {
                    totalAmount = 0;
                    investedValue = 0;
                }
            }
        }

        return investedValue * exchangeRate;
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

public record PublicHoldingDto(
    string Symbol,
    string Name,
    decimal Amount,
    decimal? PriceUsd,
    decimal? ChangePercent24h,
    int? Rank,
    decimal InvestedValue
);

public record PublicProfileResponse(
    Guid ProfilePublicId,
    string Username,
    int? Rank,
    decimal Balance,
    string Currency,
    decimal ExchangeRate,
    List<PublicHoldingDto> Holdings
);