using CryptoCompete.Api.Constants;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/currency")]
[AllowAnonymous]
public class CurrencyController : ControllerBase
{
    public const string CookieName = "display_currency";
    public const string DefaultCurrency = "EUR";
    private const int CookieExpirationDays = 365;
    private readonly bool _isProduction;
    private readonly ICurrencyService _currencyService;

    public CurrencyController(IWebHostEnvironment environment, ICurrencyService currencyService)
    {
        _isProduction = environment.IsProduction();
        _currencyService = currencyService;
    }

    public static string GetDisplayCurrency(HttpRequest request)
    {
        var currency = request.Cookies[CookieName];
        
        if (string.IsNullOrEmpty(currency) || !SupportedCurrencies.IsSupported(currency))
        {
            return DefaultCurrency;
        }

        return currency.ToUpperInvariant();
    }

    [HttpGet]
    public async Task<IActionResult> GetCurrency()
    {
        var currency = GetDisplayCurrency(Request);
        var eurExchangeRate = await _currencyService.GetExchangeRateAsync("EUR", currency);
        return Ok(new CurrencyResponse(currency, SupportedCurrencies.Codes.ToList(), eurExchangeRate));
    }

    [HttpPut]
    public async Task<IActionResult> SetCurrency([FromBody] SetCurrencyRequest request)
    {
        if (string.IsNullOrEmpty(request.Currency))
        {
            return BadRequest(new { message = "Currency is required" });
        }

        var currency = request.Currency.ToUpperInvariant();

        if (!SupportedCurrencies.IsSupported(currency))
        {
            return BadRequest(new { message = "Unsupported currency" });
        }

        Response.Cookies.Append(CookieName, currency, new CookieOptions
        {
            HttpOnly = false,
            Secure = _isProduction,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(CookieExpirationDays)
        });

        var eurExchangeRate = await _currencyService.GetExchangeRateAsync("EUR", currency);

        return Ok(new CurrencyResponse(currency, SupportedCurrencies.Codes.ToList(), eurExchangeRate));
    }
}

public record CurrencyResponse(string Currency, List<string> SupportedCurrencies, decimal EurExchangeRate);
public record SetCurrencyRequest(string Currency);