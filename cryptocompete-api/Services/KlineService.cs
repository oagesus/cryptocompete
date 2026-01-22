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
        { KlineTimeframe.Day1, new("5m", TimeSpan.FromDays(1), TimeSpan.FromMinutes(5)) },
        { KlineTimeframe.Day7, new("15m", TimeSpan.FromDays(7), TimeSpan.FromMinutes(15)) },
        { KlineTimeframe.Month1, new("1h", TimeSpan.FromDays(30), TimeSpan.FromHours(1)) },
        { KlineTimeframe.Month3, new("4h", TimeSpan.FromDays(90), TimeSpan.FromHours(4)) },
        { KlineTimeframe.Year1, new("1d", TimeSpan.FromDays(365), TimeSpan.FromHours(24)) }
    };

    private static TimeframeConfig GetYtdConfig()
    {
        var now = DateTimeOffset.UtcNow;
        var startOfYear = new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var daysElapsed = (int)(now - startOfYear).TotalDays;

        return daysElapsed switch
        {
            <= 7 => new("15m", TimeSpan.Zero, TimeSpan.FromMinutes(15)),
            <= 30 => new("1h", TimeSpan.Zero, TimeSpan.FromHours(1)),
            <= 90 => new("4h", TimeSpan.Zero, TimeSpan.FromHours(4)),
            _ => new("1d", TimeSpan.Zero, TimeSpan.FromHours(24))
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
        var cacheKey = $"klines_{symbol.ToUpperInvariant()}_{timeframe}";

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

        _cache.Set(cacheKey, result, config.CacheDuration);

        return result;
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

    private record TimeframeConfig(string Interval, TimeSpan Lookback, TimeSpan CacheDuration);
}