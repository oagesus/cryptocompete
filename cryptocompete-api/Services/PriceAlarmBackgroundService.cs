using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Services;

public class PriceAlarmBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly CryptoPriceBackgroundService _priceService;
    private readonly ILogger<PriceAlarmBackgroundService> _logger;
    private readonly string _frontendUrl;

    public PriceAlarmBackgroundService(
        IServiceScopeFactory scopeFactory,
        CryptoPriceBackgroundService priceService,
        ILogger<PriceAlarmBackgroundService> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _priceService = priceService;
        _logger = logger;
        _frontendUrl = configuration["FrontendUrl"] ?? "https://cryptocompete.com";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PriceAlarmBackgroundService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var nextMinute = new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute, 0, DateTimeKind.Utc).AddMinutes(1);
            var delay = nextMinute - now;

            await Task.Delay(delay, stoppingToken);

            try
            {
                await CheckAlarmsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking price alarms");
            }
        }
    }

    private async Task CheckAlarmsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var alarms = await db.PriceAlarms
            .Include(a => a.User)
            .Include(a => a.Cryptocurrency)
            .Where(a => !a.IsDelisted && (!a.IsTriggered || a.IsRecurring))
            .ToListAsync(cancellationToken);

        if (alarms.Count == 0) return;

        var currencies = alarms.Select(a => a.Currency).Distinct().ToList();
        var ratesToUsd = new Dictionary<string, decimal>();
        foreach (var currency in currencies)
        {
            try
            {
                ratesToUsd[currency] = await currencyService.GetExchangeRateAsync(currency, "USD");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Skipping alarms for currency {Currency} — exchange rate unavailable", currency);
            }
        }

        var alarmsToNotify = new List<(PriceAlarm Alarm, decimal CurrentPriceUsd)>();
        var hasChanges = false;

        foreach (var alarm in alarms)
        {
            var currentPriceUsd = _priceService.GetPrice(alarm.Cryptocurrency.Symbol);
            if (!currentPriceUsd.HasValue) continue;
            if (!ratesToUsd.ContainsKey(alarm.Currency)) continue;

            var targetPriceUsd = alarm.TargetPrice * ratesToUsd[alarm.Currency];

            var isConditionMet = alarm.IsAbove
                ? (decimal)currentPriceUsd.Value >= targetPriceUsd
                : (decimal)currentPriceUsd.Value <= targetPriceUsd;

            if (isConditionMet && !alarm.IsTriggered)
            {
                alarm.IsTriggered = true;
                alarm.TriggeredAt = DateTimeOffset.UtcNow;
                hasChanges = true;
                alarmsToNotify.Add((alarm, (decimal)currentPriceUsd.Value));
            }
            else if (!isConditionMet && alarm.IsTriggered && alarm.IsRecurring)
            {
                alarm.IsTriggered = false;
                hasChanges = true;
            }
        }

        if (alarmsToNotify.Count == 0)
        {
            if (hasChanges) await db.SaveChangesAsync(cancellationToken);
            return;
        }

        _logger.LogInformation("Triggered {Count} price alarms", alarmsToNotify.Count);

        var ratesFromUsd = new Dictionary<string, decimal>();
        var notifyCurrencies = alarmsToNotify.Select(a => a.Alarm.Currency).Distinct().ToList();
        foreach (var currency in notifyCurrencies)
        {
            try
            {
                ratesFromUsd[currency] = await currencyService.GetExchangeRateAsync("USD", currency);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Skipping notification for currency {Currency} — exchange rate unavailable", currency);
            }
        }

        var now = DateTimeOffset.UtcNow;

        foreach (var (alarm, currentPriceUsd) in alarmsToNotify)
        {
            alarm.IsTriggered = true;
            alarm.TriggeredAt = now;

            if (!ratesFromUsd.ContainsKey(alarm.Currency)) continue;

            try
            {
                var currentPriceInCurrency = currentPriceUsd * ratesFromUsd[alarm.Currency];
                var currencySymbol = GetCurrencySymbol(alarm.Currency);

                var targetPriceFormatted = FormatPrice(alarm.TargetPrice);
                var currentPriceFormatted = FormatPrice(currentPriceInCurrency);
                var tz = TimeZoneInfo.FindSystemTimeZoneById(alarm.User.Timezone ?? "UTC");
                var localTime = TimeZoneInfo.ConvertTime(now, tz);
                var offset = tz.GetUtcOffset(localTime);
                var offsetStr = offset >= TimeSpan.Zero ? $"UTC+{offset.TotalHours:0}" : $"UTC{offset.TotalHours:0}";
                var displayTime = localTime.Second >= 55 ? localTime.AddMinutes(1) : localTime;
                var triggeredAt = displayTime.ToString("MMMM dd, yyyy 'at' HH:mm") + $" [" + offsetStr + "]";
                var checkPricesLink = $"{_frontendUrl}/trade/buy/{alarm.Cryptocurrency.Symbol.ToLower()}";

                await emailService.SendPriceAlarmEmailAsync(
                    alarm.User.Email,
                    alarm.Cryptocurrency.Name,
                    alarm.Cryptocurrency.Symbol,
                    targetPriceFormatted,
                    currentPriceFormatted,
                    currencySymbol,
                    alarm.IsAbove,
                    triggeredAt,
                    checkPricesLink
                );

                _logger.LogInformation(
                    "Price alarm email sent to {Email} for {Symbol} at {Price} {Currency}",
                    alarm.User.Email, alarm.Cryptocurrency.Symbol, targetPriceFormatted, alarm.Currency
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send price alarm email for alarm {AlarmId}", alarm.Id);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string FormatPrice(decimal price)
    {
        return price >= 10
            ? price.ToString("N2")
            : price.ToString("N6");
    }

    private static readonly Dictionary<string, string> CurrencySymbols = new()
    {
        { "EUR", "€" }, { "USD", "$" }, { "GBP", "£" },
        { "JPY", "¥" }, { "AUD", "A$" }, { "CAD", "CA$" }
    };

    private static string GetCurrencySymbol(string currencyCode)
    {
        return CurrencySymbols.TryGetValue(currencyCode, out var symbol) ? symbol : currencyCode + " ";
    }
}