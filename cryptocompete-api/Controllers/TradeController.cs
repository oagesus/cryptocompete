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
    private const int CryptoDecimalPrecision = 8;
    
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
        var eurToUsd = await _currencyService.GetExchangeRateAsync("EUR", "USD");

        decimal spendAmountEur;
        decimal cryptoAmount;

        if (request.Mode == "crypto")
        {
            cryptoAmount = Math.Round(request.Amount, CryptoDecimalPrecision);
            
            if (cryptoAmount <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than 0" });
            }
            
            var valueUsd = cryptoAmount * priceUsd.Value;
            var usdToEur = await _currencyService.GetExchangeRateAsync("USD", "EUR");
            spendAmountEur = valueUsd * usdToEur;
        }
        else
        {
            spendAmountEur = request.Amount * userCurrencyToEur;
            
            if (spendAmountEur <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than 0" });
            }
            
            var spendAmountUsd = spendAmountEur * eurToUsd;
            cryptoAmount = Math.Round(spendAmountUsd / priceUsd.Value, CryptoDecimalPrecision);
        }

        if (cryptoAmount <= 0 || Math.Round(spendAmountEur, 2) <= 0)
        {
            return BadRequest(new { message = "Amount too small" });
        }

        if (spendAmountEur > profile.Balance)
        {
            return BadRequest(new { message = "Insufficient balance" });
        }

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
            PricePerUnit = Math.Round(spendAmountEur / cryptoAmount, CryptoDecimalPrecision),
            TotalValue = Math.Round(spendAmountEur, 2)
        };
        _db.Transactions.Add(transaction);

        await _db.SaveChangesAsync();

        var eurToUserCurrency = await _currencyService.GetExchangeRateAsync("EUR", user.DisplayCurrency);

        return Ok(new TradeResponse(
            crypto.Symbol,
            crypto.Name,
            TransactionType.Buy.ToString(),
            cryptoAmount,
            Math.Round(spendAmountEur * eurToUserCurrency, 2),
            user.DisplayCurrency,
            Math.Round(profile.Balance * eurToUserCurrency, 2)
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

        var priceUsd = _priceService.GetPrice(crypto.Symbol);
        if (!priceUsd.HasValue)
        {
            return BadRequest(new { message = $"Price not available for {crypto.Symbol}" });
        }

        var usdToEur = await _currencyService.GetExchangeRateAsync("USD", "EUR");
        var userCurrencyToEur = await _currencyService.GetExchangeRateAsync(user.DisplayCurrency, "EUR");

        decimal cryptoAmount;
        decimal valueEur;

        if (request.Mode == "receive")
        {
            var receiveAmountEur = request.Amount * userCurrencyToEur;
            
            if (receiveAmountEur <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than 0" });
            }
            
            var eurToUsd = await _currencyService.GetExchangeRateAsync("EUR", "USD");
            var receiveAmountUsd = receiveAmountEur * eurToUsd;
            cryptoAmount = Math.Round(receiveAmountUsd / priceUsd.Value, CryptoDecimalPrecision);
            valueEur = receiveAmountEur;
        }
        else
        {
            cryptoAmount = Math.Round(request.Amount, CryptoDecimalPrecision);
            
            if (cryptoAmount <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than 0" });
            }
            
            var valueUsd = cryptoAmount * priceUsd.Value;
            valueEur = valueUsd * usdToEur;
        }

        if (cryptoAmount <= 0 || Math.Round(valueEur, 2) <= 0)
        {
            return BadRequest(new { message = "Amount too small" });
        }

        if (cryptoAmount > holding.Amount)
        {
            return BadRequest(new { message = $"Insufficient {crypto.Symbol} balance" });
        }

        holding.Amount -= cryptoAmount;
        holding.UpdatedAt = DateTimeOffset.UtcNow;

        profile.Balance += valueEur;

        var transaction = new Transaction
        {
            ProfileId = profile.Id,
            CryptocurrencyId = crypto.Id,
            Type = TransactionType.Sell,
            Amount = cryptoAmount,
            PricePerUnit = Math.Round(valueEur / cryptoAmount, CryptoDecimalPrecision),
            TotalValue = Math.Round(valueEur, 2)
        };
        _db.Transactions.Add(transaction);

        await _db.SaveChangesAsync();

        var eurToUserCurrency = await _currencyService.GetExchangeRateAsync("EUR", user.DisplayCurrency);

        return Ok(new TradeResponse(
            crypto.Symbol,
            crypto.Name,
            TransactionType.Sell.ToString(),
            cryptoAmount,
            Math.Round(valueEur * eurToUserCurrency, 2),
            user.DisplayCurrency,
            Math.Round(profile.Balance * eurToUserCurrency, 2)
        ));
    }
}

public record TradeRequest(string Symbol, decimal Amount, string Mode = "spend");
public record TradeSellRequest(string Symbol, decimal Amount, string Mode = "sell");
public record TradeResponse(
    string Symbol,
    string Name,
    string Type,
    decimal CryptoAmount,
    decimal Value,
    string Currency,
    decimal NewBalance
);