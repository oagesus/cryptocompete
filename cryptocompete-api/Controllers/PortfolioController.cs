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

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized();
        }

        var profile = await _db.Profiles
            .Include(p => p.Holdings)
                .ThenInclude(h => h.Cryptocurrency)
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => p.PublicId == profilePublicId && p.UserId == userId);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found" });
        }

        var displayCurrency = user.DisplayCurrency;
        var exchangeRate = await _currencyService.GetExchangeRateAsync("USD", displayCurrency);
        var balanceExchangeRate = await _currencyService.GetExchangeRateAsync("EUR", displayCurrency);
        var convertedBalance = profile.Balance * balanceExchangeRate;

        var holdings = profile.Holdings
            .Where(h => h.Amount > 0)
            .Select(h =>
            {
                var priceUsd = _priceService.GetPrice(h.Cryptocurrency.Symbol);
                var investedValue = CalculateInvestedValue(profile.Transactions, h.CryptocurrencyId, balanceExchangeRate);

                return new HoldingDto(
                    h.Cryptocurrency.Symbol,
                    h.Cryptocurrency.Name,
                    h.Amount,
                    priceUsd,
                    investedValue,
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

public record HoldingDto(
    string Symbol, 
    string Name, 
    decimal Amount, 
    decimal? PriceUsd,
    decimal InvestedValue,
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