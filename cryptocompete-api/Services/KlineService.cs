using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace CryptoCompete.Api.Services;

public class KlineService : IKlineService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<KlineService> _logger;

    private static readonly Dictionary<KlineTimeframe, TimeframeConfig> TimeframeConfigs = new()
    {
        { KlineTimeframe.Day1, new("5m", TimeSpan.FromDays(1)) },
        { KlineTimeframe.Day7, new("15m", TimeSpan.FromDays(7)) },
        { KlineTimeframe.Month1, new("1h", TimeSpan.FromDays(30)) },
        { KlineTimeframe.Month3, new("4h", TimeSpan.FromDays(90)) },
        { KlineTimeframe.Year1, new("1d", TimeSpan.FromDays(365)) }
    };

    private static TimeframeConfig GetYtdConfig()
    {
        var now = DateTimeOffset.UtcNow;
        var startOfYear = new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var daysElapsed = (int)(now - startOfYear).TotalDays;

        return daysElapsed switch
        {
            <= 7 => new("15m", TimeSpan.Zero),
            <= 30 => new("1h", TimeSpan.Zero),
            <= 90 => new("4h", TimeSpan.Zero),
            _ => new("1d", TimeSpan.Zero)
        };
    }

    public KlineService(HttpClient httpClient, IMemoryCache cache, ILogger<KlineService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
    }

    public async Task<KlineData> GetKlinesAsync(string symbol, KlineTimeframe timeframe, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetCacheKey(symbol, timeframe);
        var cacheExpiration = GetCacheExpiration(timeframe);

        if (_cache.TryGetValue<KlineData>(cacheKey, out var cachedData) && cachedData != null)
        {
            return cachedData with { FromCache = true };
        }

        var config = timeframe == KlineTimeframe.YearToDate 
            ? GetYtdConfig() 
            : TimeframeConfigs[timeframe];
        var (startTime, endTime) = GetTimeRange(timeframe, config);

        var klines = await FetchKlinesAsync(symbol, config.Interval, startTime, endTime, cancellationToken);

        var result = new KlineData(
            symbol.ToUpperInvariant(),
            timeframe,
            config.Interval,
            klines,
            false,
            DateTimeOffset.UtcNow
        );

        _cache.Set(cacheKey, result, cacheExpiration);

        return result;
    }

    private static string GetCacheKey(string symbol, KlineTimeframe timeframe)
    {
        return $"klines_{symbol.ToUpperInvariant()}_{timeframe}";
    }

    private static DateTimeOffset GetCacheExpiration(KlineTimeframe timeframe)
    {
        var now = DateTimeOffset.UtcNow;

        if (timeframe == KlineTimeframe.YearToDate)
        {
            var startOfYear = new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var daysElapsed = (int)(now - startOfYear).TotalDays;

            return daysElapsed switch
            {
                <= 1 => GetNextInterval(now, 5),
                <= 7 => GetNextInterval(now, 15),
                <= 30 => new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, 0, 0, TimeSpan.Zero).AddHours(1),
                <= 90 => new DateTimeOffset(now.Year, now.Month, now.Day, (now.Hour / 4) * 4, 0, 0, TimeSpan.Zero).AddHours(4),
                _ => GetNextDailyReset(now)
            };
        }

        return timeframe switch
        {
            KlineTimeframe.Day1 => GetNextInterval(now, 5),
            KlineTimeframe.Day7 => GetNextInterval(now, 15),
            KlineTimeframe.Month1 => new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, 0, 0, TimeSpan.Zero).AddHours(1),
            KlineTimeframe.Month3 => new DateTimeOffset(now.Year, now.Month, now.Day, (now.Hour / 4) * 4, 0, 0, TimeSpan.Zero).AddHours(4),
            KlineTimeframe.Year1 => GetNextDailyReset(now),
            _ => now.AddMinutes(5)
        };
    }

    private static DateTimeOffset GetNextInterval(DateTimeOffset now, int intervalMinutes)
    {
        var currentIntervalStart = (now.Minute / intervalMinutes) * intervalMinutes;
        return new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, currentIntervalStart, 0, TimeSpan.Zero)
            .AddMinutes(intervalMinutes);
    }

    private static DateTimeOffset GetNextDailyReset(DateTimeOffset now)
    {
        var isSummer = now.Month >= 4 && now.Month <= 10;
        var resetHour = isSummer ? 2 : 1;

        var todayReset = new DateTimeOffset(now.Year, now.Month, now.Day, resetHour, 0, 0, TimeSpan.Zero);

        if (now < todayReset)
        {
            return todayReset;
        }

        return todayReset.AddDays(1);
    }

    private static (long startTime, long endTime) GetTimeRange(KlineTimeframe timeframe, TimeframeConfig config)
    {
        var now = DateTimeOffset.UtcNow;
        var endTime = now.ToUnixTimeMilliseconds();

        long startTime;
        if (timeframe == KlineTimeframe.YearToDate)
        {
            var startOfYear = new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
            startTime = startOfYear.ToUnixTimeMilliseconds();
        }
        else
        {
            startTime = now.Subtract(config.Lookback).ToUnixTimeMilliseconds();
        }

        return (startTime, endTime);
    }

    private async Task<List<Kline>> FetchKlinesAsync(
        string symbol,
        string interval,
        long startTime,
        long endTime,
        CancellationToken cancellationToken)
    {
        var allKlines = new List<Kline>();
        var currentStartTime = startTime;
        const int limit = 1000;

        while (currentStartTime < endTime)
        {
            var url = $"https://api.binance.com/api/v3/klines?symbol={symbol.ToUpperInvariant()}USDT&interval={interval}&startTime={currentStartTime}&endTime={endTime}&limit={limit}";

            try
            {
                var response = await _httpClient.GetStringAsync(url, cancellationToken);
                var rawKlines = JsonSerializer.Deserialize<List<JsonElement>>(response);

                if (rawKlines == null || rawKlines.Count == 0)
                    break;

                foreach (var k in rawKlines)
                {
                    var kline = ParseKline(k);
                    if (kline != null)
                        allKlines.Add(kline);
                }

                if (rawKlines.Count < limit)
                    break;

                currentStartTime = rawKlines.Last()[6].GetInt64() + 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch klines for {Symbol}", symbol);
                break;
            }
        }

        return allKlines;
    }

    private static Kline? ParseKline(JsonElement element)
    {
        try
        {
            return new Kline(
                element[0].GetInt64(),
                decimal.Parse(element[1].GetString()!, CultureInfo.InvariantCulture),
                decimal.Parse(element[2].GetString()!, CultureInfo.InvariantCulture),
                decimal.Parse(element[3].GetString()!, CultureInfo.InvariantCulture),
                decimal.Parse(element[4].GetString()!, CultureInfo.InvariantCulture),
                decimal.Parse(element[5].GetString()!, CultureInfo.InvariantCulture),
                element[6].GetInt64()
            );
        }
        catch
        {
            return null;
        }
    }

    private record TimeframeConfig(string Interval, TimeSpan Lookback);
}