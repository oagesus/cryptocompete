using System.Security.Claims;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/trade")]
[Authorize]
public class TradeController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrencyService _currencyService;
    private readonly CryptoPriceBackgroundService _priceService;

    public TradeController(
        AppDbContext db,
        ICurrencyService currencyService,
        CryptoPriceBackgroundService priceService)
    {
        _db = db;
        _currencyService = currencyService;
        _priceService = priceService;
    }

    [HttpPost("buy")]
    public async Task<IActionResult> Buy([FromBody] TradeRequest request)
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
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Id == user.ActiveProfileId);

        if (profile == null)
        {
            return BadRequest(new { message = "No active profile found" });
        }

        var crypto = await _db.Cryptocurrencies
            .FirstOrDefaultAsync(c => c.Symbol.ToLower() == request.Symbol.ToLower() && c.IsActive);

        if (crypto == null)
        {
            return NotFound(new { message = $"Cryptocurrency {request.Symbol} not found" });
        }

        var priceUsd = _priceService.GetPrice(crypto.Symbol);
        if (!priceUsd.HasValue)
        {
            return BadRequest(new { message = $"Price not available for {crypto.Symbol}" });
        }

        var userCurrencyToEur = await _currencyService.GetExchangeRateAsync(user.DisplayCurrency, "EUR");
        var spendAmountEur = request.Amount * userCurrencyToEur;

        if (spendAmountEur <= 0)
        {
            return BadRequest(new { message = "Amount must be greater than 0" });
        }

        if (spendAmountEur > profile.Balance)
        {
            return BadRequest(new { message = "Insufficient balance" });
        }

        var eurToUsd = await _currencyService.GetExchangeRateAsync("EUR", "USD");
        var spendAmountUsd = spendAmountEur * eurToUsd;
        var cryptoAmount = spendAmountUsd / priceUsd.Value;

        profile.Balance -= spendAmountEur;

        var holding = profile.Holdings.FirstOrDefault(h => h.CryptocurrencyId == crypto.Id);
        if (holding == null)
        {
            holding = new PortfolioHolding
            {
                ProfileId = profile.Id,
                CryptocurrencyId = crypto.Id,
                Amount = cryptoAmount
            };
            _db.PortfolioHoldings.Add(holding);
        }
        else
        {
            holding.Amount += cryptoAmount;
            holding.UpdatedAt = DateTimeOffset.UtcNow;
        }

        var transaction = new Transaction
        {
            ProfileId = profile.Id,
            CryptocurrencyId = crypto.Id,
            Type = TransactionType.Buy,
            Amount = cryptoAmount,
            PricePerUnit = spendAmountEur / cryptoAmount,
            TotalValue = spendAmountEur
        };
        _db.Transactions.Add(transaction);

        await _db.SaveChangesAsync();

        var eurToUserCurrency = await _currencyService.GetExchangeRateAsync("EUR", user.DisplayCurrency);

        return Ok(new TradeResponse(
            crypto.Symbol,
            crypto.Name,
            TransactionType.Buy.ToString(),
            cryptoAmount,
            request.Amount,
            user.DisplayCurrency,
            profile.Balance * eurToUserCurrency
        ));
    }

    [HttpPost("sell")]
    public async Task<IActionResult> Sell([FromBody] TradeSellRequest request)
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
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Id == user.ActiveProfileId);

        if (profile == null)
        {
            return BadRequest(new { message = "No active profile found" });
        }

        var crypto = await _db.Cryptocurrencies
            .FirstOrDefaultAsync(c => c.Symbol.ToLower() == request.Symbol.ToLower() && c.IsActive);

        if (crypto == null)
        {
            return NotFound(new { message = $"Cryptocurrency {request.Symbol} not found" });
        }

        var holding = profile.Holdings.FirstOrDefault(h => h.CryptocurrencyId == crypto.Id);
        if (holding == null || holding.Amount <= 0)
        {
            return BadRequest(new { message = $"You don't own any {crypto.Symbol}" });
        }

        if (request.CryptoAmount <= 0)
        {
            return BadRequest(new { message = "Amount must be greater than 0" });
        }

        if (request.CryptoAmount > holding.Amount)
        {
            return BadRequest(new { message = $"Insufficient {crypto.Symbol} balance. You have {holding.Amount}" });
        }

        var priceUsd = _priceService.GetPrice(crypto.Symbol);
        if (!priceUsd.HasValue)
        {
            return BadRequest(new { message = $"Price not available for {crypto.Symbol}" });
        }

        var valueUsd = request.CryptoAmount * priceUsd.Value;
        var usdToEur = await _currencyService.GetExchangeRateAsync("USD", "EUR");
        var valueEur = valueUsd * usdToEur;

        holding.Amount -= request.CryptoAmount;
        holding.UpdatedAt = DateTimeOffset.UtcNow;

        profile.Balance += valueEur;

        var transaction = new Transaction
        {
            ProfileId = profile.Id,
            CryptocurrencyId = crypto.Id,
            Type = TransactionType.Sell,
            Amount = request.CryptoAmount,
            PricePerUnit = valueEur / request.CryptoAmount,
            TotalValue = valueEur
        };
        _db.Transactions.Add(transaction);

        await _db.SaveChangesAsync();

        var eurToUserCurrency = await _currencyService.GetExchangeRateAsync("EUR", user.DisplayCurrency);

        return Ok(new TradeResponse(
            crypto.Symbol,
            crypto.Name,
            TransactionType.Sell.ToString(),
            request.CryptoAmount,
            valueEur * eurToUserCurrency,
            user.DisplayCurrency,
            profile.Balance * eurToUserCurrency
        ));
    }
}

public record TradeRequest(string Symbol, decimal Amount);
public record TradeSellRequest(string Symbol, decimal CryptoAmount);
public record TradeResponse(
    string Symbol,
    string Name,
    string Type,
    decimal CryptoAmount,
    decimal Value,
    string Currency,
    decimal NewBalance
);