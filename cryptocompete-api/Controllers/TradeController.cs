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
        if (!decimal.TryParse(request.Amount, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var amount) || amount <= 0)
        {
            return BadRequest(new { message = "Invalid amount" });
        }

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

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
        var userCurrencyToEur = await _currencyService.GetExchangeRateAsync(displayCurrency, "EUR");
        var eurToUsd = await _currencyService.GetExchangeRateAsync("EUR", "USD");
        var usdToEur = 1m / eurToUsd;
        var eurToUserCurrency = 1m / userCurrencyToEur;

        decimal spendAmountEur;
        decimal cryptoAmount;

        if (request.Mode == "crypto")
        {
            cryptoAmount = Math.Round(amount, CryptoDecimalPrecision);
            
            if (cryptoAmount <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than 0" });
            }
            
            var valueUsd = cryptoAmount * priceUsd.Value;
            spendAmountEur = valueUsd * usdToEur;
        }
        else
        {
            spendAmountEur = amount * userCurrencyToEur;
            
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

        return Ok(new TradeResponse(
            crypto.Symbol,
            crypto.Name,
            TransactionType.Buy.ToString(),
            cryptoAmount,
            cryptoAmount.ToString("F18").TrimEnd('0').TrimEnd('.'),
            Math.Round(spendAmountEur * eurToUserCurrency, 2),
            displayCurrency,
            Math.Round(profile.Balance * eurToUserCurrency, 2)
        ));
    }

    [HttpPost("sell")]
    public async Task<IActionResult> Sell([FromBody] TradeSellRequest request)
    {
        if (!decimal.TryParse(request.Amount, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var amount) || amount <= 0)
        {
            return BadRequest(new { message = "Invalid amount" });
        }

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

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);
        var usdToEur = await _currencyService.GetExchangeRateAsync("USD", "EUR");
        var userCurrencyToEur = await _currencyService.GetExchangeRateAsync(displayCurrency, "EUR");
        var eurToUsd = 1m / usdToEur;
        var eurToUserCurrency = 1m / userCurrencyToEur;

        decimal cryptoAmount;
        decimal valueEur;

        if (request.Mode == "receive")
        {
            var receiveAmountEur = amount * userCurrencyToEur;
            
            if (receiveAmountEur <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than 0" });
            }
            
            var receiveAmountUsd = receiveAmountEur * eurToUsd;
            cryptoAmount = Math.Round(receiveAmountUsd / priceUsd.Value, CryptoDecimalPrecision);
            valueEur = receiveAmountEur;
        }
        else
        {
            cryptoAmount = Math.Round(amount, CryptoDecimalPrecision);
            
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

        if (holding.Amount <= 0.00000001m)
        {
            holding.Amount = 0;
        }

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

        return Ok(new TradeResponse(
            crypto.Symbol,
            crypto.Name,
            TransactionType.Sell.ToString(),
            cryptoAmount,
            cryptoAmount.ToString("F18").TrimEnd('0').TrimEnd('.'),
            Math.Round(valueEur * eurToUserCurrency, 2),
            displayCurrency,
            Math.Round(profile.Balance * eurToUserCurrency, 2)
        ));
    }
    [HttpPost("price-alarm")]
    public async Task<IActionResult> CreatePriceAlarm([FromBody] CreatePriceAlarmRequest request)
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

        var crypto = await _db.Cryptocurrencies
            .FirstOrDefaultAsync(c => c.Symbol.ToLower() == request.Symbol.ToLower() && c.IsActive);

        if (crypto == null)
        {
            return NotFound(new { message = $"Cryptocurrency {request.Symbol} not found" });
        }

        if (request.TargetPrice <= 0)
        {
            return BadRequest(new { message = "Target price must be greater than 0" });
        }

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);

        var priceUsd = _priceService.GetPrice(crypto.Symbol);
        var userCurrencyToUsd = await _currencyService.GetExchangeRateAsync(displayCurrency, "USD");
        var targetPriceUsd = request.TargetPrice * userCurrencyToUsd;
        var currentPriceUsd = priceUsd.HasValue ? (decimal)priceUsd.Value : 0;
        var isAbove = targetPriceUsd >= currentPriceUsd;

        var alarm = new PriceAlarm
        {
            UserId = userId,
            CryptocurrencyId = crypto.Id,
            TargetPrice = request.TargetPrice,
            Currency = displayCurrency,
            IsAbove = isAbove,
            IsRecurring = request.IsRecurring
        };
        _db.PriceAlarms.Add(alarm);

        await _db.SaveChangesAsync();

        return Ok(new PriceAlarmDto(
            alarm.PublicId,
            crypto.Symbol,
            crypto.Name,
            alarm.TargetPrice,
            alarm.Currency,
            alarm.IsAbove,
            alarm.IsRecurring,
            alarm.IsTriggered,
            alarm.CreatedAt
        ));
    }

    [HttpGet("price-alarms")]
    public async Task<IActionResult> GetPriceAlarms()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var alarms = await _db.PriceAlarms
            .Include(a => a.Cryptocurrency)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var result = alarms.Select(a => new PriceAlarmDto(
            a.PublicId,
            a.Cryptocurrency.Symbol,
            a.Cryptocurrency.Name,
            a.TargetPrice,
            a.Currency,
            a.IsAbove,
            a.IsRecurring,
            a.IsTriggered,
            a.CreatedAt
        )).ToList();

        return Ok(new PriceAlarmsResponse(result));
    }

    [HttpPut("price-alarm/{publicId}")]
    public async Task<IActionResult> UpdatePriceAlarm(Guid publicId, [FromBody] UpdatePriceAlarmRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var alarm = await _db.PriceAlarms
            .Include(a => a.Cryptocurrency)
            .FirstOrDefaultAsync(a => a.PublicId == publicId && a.UserId == userId);

        if (alarm == null)
        {
            return NotFound(new { message = "Price alarm not found" });
        }

        if (request.TargetPrice <= 0)
        {
            return BadRequest(new { message = "Target price must be greater than 0" });
        }

        var displayCurrency = CurrencyController.GetDisplayCurrency(Request);

        var priceUsd = _priceService.GetPrice(alarm.Cryptocurrency.Symbol);
        var userCurrencyToUsd = await _currencyService.GetExchangeRateAsync(displayCurrency, "USD");
        var targetPriceUsd = request.TargetPrice * userCurrencyToUsd;
        var currentPriceUsd = priceUsd.HasValue ? (decimal)priceUsd.Value : 0;

        alarm.TargetPrice = request.TargetPrice;
        alarm.Currency = displayCurrency;
        alarm.IsAbove = targetPriceUsd >= currentPriceUsd;
        alarm.IsRecurring = request.IsRecurring;
        alarm.IsTriggered = false;
        alarm.TriggeredAt = null;

        await _db.SaveChangesAsync();

        return Ok(new PriceAlarmDto(
            alarm.PublicId,
            alarm.Cryptocurrency.Symbol,
            alarm.Cryptocurrency.Name,
            alarm.TargetPrice,
            alarm.Currency,
            alarm.IsAbove,
            alarm.IsRecurring,
            alarm.IsTriggered,
            alarm.CreatedAt
        ));
    }

    [HttpDelete("price-alarm/{publicId}")]
    public async Task<IActionResult> DeletePriceAlarm(Guid publicId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var alarm = await _db.PriceAlarms.FirstOrDefaultAsync(a => a.PublicId == publicId && a.UserId == userId);
        if (alarm == null)
        {
            return NotFound(new { message = "Price alarm not found" });
        }

        _db.PriceAlarms.Remove(alarm);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Price alarm deleted" });
    }
}

public record TradeRequest(string Symbol, string Amount, string Mode = "spend");
public record TradeSellRequest(string Symbol, string Amount, string Mode = "sell");
public record TradeResponse(
    string Symbol,
    string Name,
    string Type,
    decimal CryptoAmount,
    string CryptoAmountRaw,
    decimal Value,
    string Currency,
    decimal NewBalance
);

public record CreatePriceAlarmRequest(string Symbol, decimal TargetPrice, bool IsRecurring = false);
public record UpdatePriceAlarmRequest(decimal TargetPrice, bool IsRecurring = false);

public record PriceAlarmDto(
    Guid PublicId,
    string Symbol,
    string Name,
    decimal TargetPrice,
    string Currency,
    bool IsAbove,
    bool IsRecurring,
    bool IsTriggered,
    DateTimeOffset CreatedAt
);

public record PriceAlarmsResponse(
    List<PriceAlarmDto> Alarms
);