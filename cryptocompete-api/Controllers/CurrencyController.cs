using CryptoCompete.Api.Constants;
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

    public CurrencyController(IWebHostEnvironment environment)
    {
        _isProduction = environment.IsProduction();
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
    public IActionResult GetCurrency()
    {
        var currency = GetDisplayCurrency(Request);
        return Ok(new CurrencyResponse(currency, SupportedCurrencies.Codes.ToList()));
    }

    [HttpPut]
    public IActionResult SetCurrency([FromBody] SetCurrencyRequest request)
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

        return Ok(new CurrencyResponse(currency, SupportedCurrencies.Codes.ToList()));
    }
}

public record CurrencyResponse(string Currency, List<string> SupportedCurrencies);
public record SetCurrencyRequest(string Currency);