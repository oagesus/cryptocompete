using System.Security.Claims;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/cryptocurrencies")]
[AllowAnonymous]
public class CryptocurrencyController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly CryptoPriceBackgroundService _priceService;
    private readonly ICurrencyService _currencyService;

    public CryptocurrencyController(
        AppDbContext db, 
        CryptoPriceBackgroundService priceService,
        ICurrencyService currencyService)
    {
        _db = db;
        _priceService = priceService;
        _currencyService = currencyService;
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllCryptocurrencies()
    {
        var displayCurrency = "USD";
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                displayCurrency = user.DisplayCurrency;
            }
        }

        var exchangeRate = await _currencyService.GetExchangeRateAsync("USD", displayCurrency);

        var cryptocurrencies = await _db.Cryptocurrencies
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new { 
                c.Symbol, 
                c.Name, 
                c.Rank,
                c.PercentChange7d,
                c.PercentChange30d,
                c.PercentChange60d,
                c.PercentChange90d
            })
            .ToListAsync();

        var result = cryptocurrencies.Select(c =>
        {
            var priceUsd = _priceService.GetPrice(c.Symbol);
            var changePercent24h = _priceService.GetChangePercent24h(c.Symbol);
            return new CryptocurrencyWithPriceDto(
                c.Symbol, 
                c.Name, 
                priceUsd, 
                changePercent24h, 
                c.Rank,
                c.PercentChange7d,
                c.PercentChange30d,
                c.PercentChange60d,
                c.PercentChange90d
            );
        }).ToList();

        return Ok(new CryptocurrencyListResponse(result, displayCurrency, exchangeRate));
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetCryptocurrency(string symbol)
    {
        var crypto = await _db.Cryptocurrencies
            .Where(c => c.Symbol.ToLower() == symbol.ToLower() && c.IsActive)
            .Select(c => new { 
                c.Symbol, 
                c.Name,
                c.PercentChange7d,
                c.PercentChange30d,
                c.PercentChange60d,
                c.PercentChange90d
            })
            .FirstOrDefaultAsync();

        if (crypto == null)
        {
            return NotFound(new { message = $"Cryptocurrency {symbol} not found" });
        }

        var displayCurrency = "USD";
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                displayCurrency = user.DisplayCurrency;
            }
        }

        var exchangeRate = await _currencyService.GetExchangeRateAsync("USD", displayCurrency);
        var priceUsd = _priceService.GetPrice(crypto.Symbol);
        var changePercent24h = _priceService.GetChangePercent24h(crypto.Symbol);

        return Ok(new CryptocurrencyDetailDto(
            crypto.Symbol, 
            crypto.Name, 
            priceUsd,
            changePercent24h,
            displayCurrency,
            exchangeRate,
            crypto.PercentChange7d,
            crypto.PercentChange30d,
            crypto.PercentChange60d,
            crypto.PercentChange90d
        ));
    }
}

public record CryptocurrencyDto(string Symbol, string Name);

public record CryptocurrencyWithPriceDto(
    string Symbol, 
    string Name, 
    decimal? PriceUsd, 
    decimal? ChangePercent24h, 
    int? Rank,
    decimal? PercentChange7d,
    decimal? PercentChange30d,
    decimal? PercentChange60d,
    decimal? PercentChange90d
);

public record CryptocurrencyListResponse(
    List<CryptocurrencyWithPriceDto> Cryptocurrencies, 
    string Currency, 
    decimal ExchangeRate
);

public record CryptocurrencyDetailDto(
    string Symbol, 
    string Name, 
    decimal? PriceUsd, 
    decimal? ChangePercent24h,
    string Currency,
    decimal ExchangeRate,
    decimal? PercentChange7d,
    decimal? PercentChange30d,
    decimal? PercentChange60d,
    decimal? PercentChange90d
);