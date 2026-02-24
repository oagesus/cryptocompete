using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/leaderboard")]
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
    [AllowAnonymous]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
        var exchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);
        var result = await _leaderboardService.GetLeaderboardAsync(page, pageSize, cancellationToken);

        var response = result.Entries.Select(e => new LeaderboardEntryDto(
            e.Rank,
            e.ProfilePublicId,
            e.Username,
            e.TotalValue,
            e.CalculatedAt
        )).ToList();

        return Ok(new LeaderboardResponse(response, displayCurrency, exchangeRate, result.TotalCount, result.Page, result.PageSize));
    }

    [HttpGet("profile/{username}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicProfile(string username, CancellationToken cancellationToken = default)
    {
        var profile = await _db.Profiles
            .Include(p => p.Holdings)
                .ThenInclude(h => h.Cryptocurrency)
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

        var activeHoldingIds = profile.Holdings
            .Where(h => h.Amount > 0)
            .Select(h => h.CryptocurrencyId)
            .ToHashSet();

        var delistedHoldingIds = profile.Holdings
            .Where(h => h.Amount > 0 && !h.Cryptocurrency.IsActive)
            .Select(h => h.CryptocurrencyId)
            .ToHashSet();

        Dictionary<int, decimal> delistedInvestedMap = new();

        if (delistedHoldingIds.Count > 0)
        {
            var investedData = await _db.Transactions
                .Where(t => t.ProfileId == profile.Id && delistedHoldingIds.Contains(t.CryptocurrencyId))
                .GroupBy(t => new { t.CryptocurrencyId, t.Type })
                .Select(g => new { g.Key.CryptocurrencyId, g.Key.Type, Total = g.Sum(t => t.TotalValue) })
                .ToListAsync(cancellationToken);

            foreach (var cryptoId in delistedHoldingIds)
            {
                var bought = investedData
                    .Where(d => d.CryptocurrencyId == cryptoId && d.Type == TransactionType.Buy)
                    .Sum(d => d.Total);
                var sold = investedData
                    .Where(d => d.CryptocurrencyId == cryptoId && d.Type == TransactionType.Sell)
                    .Sum(d => d.Total);
                delistedInvestedMap[cryptoId] = bought - sold;
            }
        }

        var transactions = activeHoldingIds.Count > 0
            ? await _db.Transactions
                .Where(t => t.ProfileId == profile.Id && activeHoldingIds.Contains(t.CryptocurrencyId))
                .OrderBy(t => t.CreatedAt)
                .ToListAsync(cancellationToken)
            : new List<Transaction>();

        var transactionsByCrypto = transactions
            .GroupBy(t => t.CryptocurrencyId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var holdings = profile.Holdings
            .Where(h => h.Amount > 0)
            .Select(h =>
            {
                var isDelisted = !h.Cryptocurrency.IsActive;
                decimal? priceUsd;
                decimal? changePercent;
                decimal? delistedValueInUserCurrency = null;

                if (isDelisted)
                {
                    delistedInvestedMap.TryGetValue(h.CryptocurrencyId, out var remainingEur);
                    delistedValueInUserCurrency = remainingEur > 0 ? Math.Round(remainingEur * balanceExchangeRate, 2, MidpointRounding.AwayFromZero) : null;
                    priceUsd = null;
                    changePercent = null;
                }
                else
                {
                    priceUsd = _priceService.GetPrice(h.Cryptocurrency.Symbol);
                    changePercent = _priceService.GetChangePercent24h(h.Cryptocurrency.Symbol);
                }

                transactionsByCrypto.TryGetValue(h.CryptocurrencyId, out var cryptoTransactions);
                var investedValue = CalculateInvestedValue(cryptoTransactions, balanceExchangeRate);

                return new PublicHoldingDto(
                    h.Cryptocurrency.Symbol,
                    h.Cryptocurrency.Name,
                    h.Amount,
                    h.Amount.ToString("G29"),
                    priceUsd,
                    changePercent,
                    h.Cryptocurrency.Rank,
                    investedValue,
                    isDelisted,
                    delistedValueInUserCurrency
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

    [HttpGet("profile/{username}/transactions")]
    [Authorize]
    public async Task<IActionResult> GetPublicProfileTransactions(string username, CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return Unauthorized();
        }

        var isPremium = user.UserRoles.Any(r => r.Role == Role.Premium || r.Role == Role.Admin);
        if (!isPremium)
        {
            return StatusCode(403, new { message = "Premium required" });
        }

        var profile = await _db.Profiles
            .Include(p => p.Transactions)
                .ThenInclude(t => t.Cryptocurrency)
            .FirstOrDefaultAsync(p => EF.Functions.ILike(p.Username, username), cancellationToken);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
        var exchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);
        var leaderboardEntry = await _leaderboardService.GetEntryByProfileIdAsync(profile.Id, cancellationToken);

        var transactions = profile.Transactions
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new PublicTransactionDto(
                t.Id,
                t.Cryptocurrency.Symbol,
                t.Cryptocurrency.Name,
                t.Type.ToString(),
                t.Amount,
                t.Amount.ToString("G29"),
                t.PricePerUnit,
                t.TotalValue,
                displayCurrency,
                t.CreatedAt
            ))
            .ToList();

        return Ok(new PublicTransactionsResponse(transactions, displayCurrency, exchangeRate, leaderboardEntry?.Rank));
    }

    private static decimal CalculateInvestedValue(List<Transaction>? transactions, decimal exchangeRate)
    {
        if (transactions == null || transactions.Count == 0)
            return 0;

        decimal totalAmount = 0;
        decimal investedValue = 0;

        foreach (var transaction in transactions)
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
    decimal ExchangeRate,
    int TotalCount,
    int Page,
    int PageSize
);

public record PublicHoldingDto(
    string Symbol,
    string Name,
    decimal Amount,
    string AmountRaw,
    decimal? PriceUsd,
    decimal? ChangePercent24h,
    int? Rank,
    decimal InvestedValue,
    bool IsDelisted,
    decimal? DelistedValueInUserCurrency
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

public record PublicTransactionDto(
    int Id,
    string Symbol,
    string Name,
    string Type,
    decimal Amount,
    string AmountRaw,
    decimal PricePerUnit,
    decimal TotalValue,
    string Currency,
    DateTimeOffset CreatedAt
);

public record PublicTransactionsResponse(
    List<PublicTransactionDto> Transactions,
    string Currency,
    decimal ExchangeRate,
    int? Rank
);