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
    private readonly IKlineService _klineService;

    public CryptocurrencyController(
        AppDbContext db, 
        CryptoPriceBackgroundService priceService,
        ICurrencyService currencyService,
        IKlineService klineService)
    {
        _db = db;
        _priceService = priceService;
        _currencyService = currencyService;
        _klineService = klineService;
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllCryptocurrencies()
    {
        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
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

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
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

    [HttpGet("{symbol}/klines")]
    public async Task<IActionResult> GetKlines(string symbol, [FromQuery] string timeframe = "1D", CancellationToken cancellationToken = default)
    {
        var crypto = await _db.Cryptocurrencies
            .Where(c => c.Symbol.ToLower() == symbol.ToLower() && c.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (crypto == null)
        {
            return NotFound(new { message = $"Cryptocurrency {symbol} not found" });
        }

        if (!TryParseTimeframe(timeframe, out var klineTimeframe))
        {
            return BadRequest(new { message = "Invalid timeframe. Valid values: 1D, 7D, 1M, 3M, 1Y, YTD" });
        }

        try
        {
            var klineData = await _klineService.GetKlinesAsync(crypto.Symbol, klineTimeframe, cancellationToken);

            return Ok(new KlineResponse(
                klineData.Symbol,
                timeframe.ToUpperInvariant(),
                klineData.Interval,
                klineData.Klines.Select(k => new KlineDto(
                    k.OpenTime,
                    k.Open,
                    k.High,
                    k.Low,
                    k.Close,
                    k.Volume,
                    k.CloseTime
                )).ToList(),
                klineData.FromCache,
                klineData.FetchedAt
            ));
        }
        catch (Exception)
        {
            return StatusCode(503, new { message = "Unable to fetch price data. Please try again later." });
        }
    }

    private static bool TryParseTimeframe(string input, out KlineTimeframe timeframe)
    {
        timeframe = input.ToUpperInvariant() switch
        {
            "1D" => KlineTimeframe.Day1,
            "7D" => KlineTimeframe.Day7,
            "1M" => KlineTimeframe.Month1,
            "3M" => KlineTimeframe.Month3,
            "1Y" => KlineTimeframe.Year1,
            "YTD" => KlineTimeframe.YearToDate,
            _ => default
        };

        return input.ToUpperInvariant() is "1D" or "7D" or "1M" or "3M" or "1Y" or "YTD";
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

public record KlineDto(
    long OpenTime,
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    decimal Volume,
    long CloseTime
);

public record KlineResponse(
    string Symbol,
    string Timeframe,
    string Interval,
    List<KlineDto> Klines,
    bool FromCache,
    DateTimeOffset FetchedAt
);