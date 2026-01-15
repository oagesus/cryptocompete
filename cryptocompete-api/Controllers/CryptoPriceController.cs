using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/prices")]
[Authorize]
public class CryptoPriceController : ControllerBase
{
    private readonly CryptoPriceBackgroundService _priceService;
    private readonly ICurrencyService _currencyService;

    public CryptoPriceController(
        CryptoPriceBackgroundService priceService,
        ICurrencyService currencyService)
    {
        _priceService = priceService;
        _currencyService = currencyService;
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetPrice(string symbol, [FromQuery] string currency = "USD")
    {
        var priceUsd = _priceService.GetPrice(symbol);
        if (priceUsd == null)
        {
            return NotFound(new { message = $"Price not found for {symbol}" });
        }

        var exchangeRate = await _currencyService.GetExchangeRateAsync("USD", currency);
        var convertedPrice = priceUsd.Value * exchangeRate;

        return Ok(new PriceResponse(symbol.ToUpperInvariant(), convertedPrice, currency));
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPrices([FromQuery] string currency = "USD")
    {
        var pricesUsd = _priceService.GetAllPrices();
        if (pricesUsd.Count == 0)
        {
            return Ok(new AllPricesResponse(new List<PriceResponse>(), currency));
        }

        var exchangeRate = await _currencyService.GetExchangeRateAsync("USD", currency);

        var prices = pricesUsd
            .Select(p => new PriceResponse(p.Key, p.Value * exchangeRate, currency))
            .ToList();

        return Ok(new AllPricesResponse(prices, currency));
    }
}

public record PriceResponse(string Symbol, decimal Price, string Currency);
public record AllPricesResponse(List<PriceResponse> Prices, string Currency);