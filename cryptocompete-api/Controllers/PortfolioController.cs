using System.Security.Claims;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/portfolios")]
[Authorize]
public class PortfolioController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrencyService _currencyService;
    private readonly CryptoPriceBackgroundService _priceService;

    public PortfolioController(
        AppDbContext db, 
        ICurrencyService currencyService,
        CryptoPriceBackgroundService priceService)
    {
        _db = db;
        _currencyService = currencyService;
        _priceService = priceService;
    }

    [HttpGet("{profilePublicId}")]
    public async Task<IActionResult> GetPortfolio(Guid profilePublicId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var profile = await _db.Profiles
            .Include(p => p.Holdings)
                .ThenInclude(h => h.Cryptocurrency)
            .FirstOrDefaultAsync(p => p.PublicId == profilePublicId && p.UserId == userId);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
        var exchangeRate = await _currencyService.GetExchangeRateAsync("USD", displayCurrency);
        var balanceExchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);
        var convertedBalance = profile.Balance * balanceExchangeRate;

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
                .ToListAsync();

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
                .ToListAsync()
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

                return new HoldingDto(
                    h.Cryptocurrency.Symbol,
                    h.Cryptocurrency.Name,
                    h.Amount,
                    h.Amount.ToString("F18").TrimEnd('0').TrimEnd('.'),
                    priceUsd,
                    changePercent,
                    h.Cryptocurrency.Rank,
                    investedValue,
                    isDelisted,
                    delistedValueInUserCurrency,
                    h.UpdatedAt
                );
            })
            .ToList();

        return Ok(new PortfolioResponse(
            profile.PublicId,
            profile.Username,
            convertedBalance,
            displayCurrency,
            exchangeRate,
            holdings
        ));
    }

    [HttpGet("{profilePublicId}/transactions")]
    public async Task<IActionResult> GetTransactions(Guid profilePublicId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId);

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
            .FirstOrDefaultAsync(p => p.PublicId == profilePublicId && p.UserId == userId);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
        var exchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);

        var transactions = profile.Transactions
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto(
                t.Id,
                t.Cryptocurrency.Symbol,
                t.Cryptocurrency.Name,
                t.Type.ToString(),
                t.Amount,
                t.Amount.ToString("F18").TrimEnd('0').TrimEnd('.'),
                t.PricePerUnit,
                t.TotalValue,
                displayCurrency,
                t.CreatedAt
            ))
            .ToList();

        return Ok(new TransactionsResponse(transactions, displayCurrency, exchangeRate));
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

public record HoldingDto(
    string Symbol, 
    string Name, 
    decimal Amount,
    string AmountRaw,
    decimal? PriceUsd,
    decimal? ChangePercent24h,
    int? Rank,
    decimal InvestedValue,
    bool IsDelisted,
    decimal? DelistedValueInUserCurrency,
    DateTimeOffset UpdatedAt
);

public record PortfolioResponse(
    Guid ProfilePublicId, 
    string Username, 
    decimal Balance, 
    string Currency, 
    decimal ExchangeRate,
    List<HoldingDto> Holdings
);

public record TransactionDto(
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

public record TransactionsResponse(
    List<TransactionDto> Transactions,
    string Currency,
    decimal ExchangeRate
);