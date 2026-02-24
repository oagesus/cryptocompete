using Microsoft.Extensions.Caching.Memory;

namespace CryptoCompete.Api.Services;

public class CurrencyService : ICurrencyService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CurrencyService> _logger;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromHours(24);

    private static readonly Dictionary<string, Dictionary<string, decimal>> _lastKnownRates = new();
    private static readonly object _rateLock = new();

    public CurrencyService(HttpClient httpClient, IMemoryCache cache, ILogger<CurrencyService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
    }

    public async Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency)
    {
        if (string.Equals(fromCurrency, toCurrency, StringComparison.OrdinalIgnoreCase))
            return 1m;

        var rates = await GetExchangeRatesAsync(fromCurrency, new[] { toCurrency });
        
        if (rates.TryGetValue(toCurrency, out var rate))
            return rate;

        throw new InvalidOperationException(
            $"Exchange rate from {fromCurrency} to {toCurrency} is not available");
    }

    public async Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string fromCurrency, IEnumerable<string> toCurrencies)
    {
        var cacheKey = $"rates_{fromCurrency}";
        var toCurrencyList = toCurrencies.ToList();

        if (_cache.TryGetValue<Dictionary<string, decimal>>(cacheKey, out var cachedRates) && cachedRates != null)
        {
            return cachedRates
                .Where(r => toCurrencyList.Contains(r.Key))
                .ToDictionary(r => r.Key, r => r.Value);
        }

        try
        {
            var response = await _httpClient.GetFromJsonAsync<FrankfurterResponse>(
                $"https://api.frankfurter.app/latest?from={fromCurrency}");

            if (response?.Rates != null)
            {
                _cache.Set(cacheKey, response.Rates, _cacheDuration);

                lock (_rateLock)
                {
                    _lastKnownRates[fromCurrency] = new Dictionary<string, decimal>(response.Rates);
                }

                return response.Rates
                    .Where(r => toCurrencyList.Contains(r.Key))
                    .ToDictionary(r => r.Key, r => r.Value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch exchange rates from Frankfurter API for {FromCurrency}", fromCurrency);
        }

        lock (_rateLock)
        {
            if (_lastKnownRates.TryGetValue(fromCurrency, out var lastRates))
            {
                _logger.LogWarning(
                    "Using last known exchange rates for {FromCurrency} due to API failure", fromCurrency);

                return lastRates
                    .Where(r => toCurrencyList.Contains(r.Key))
                    .ToDictionary(r => r.Key, r => r.Value);
            }
        }

        _logger.LogError("No exchange rates available for {FromCurrency} — no cached or last known rates", fromCurrency);
        return new Dictionary<string, decimal>();
    }

    public async Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency)
    {
        var rate = await GetExchangeRateAsync(fromCurrency, toCurrency);
        return amount * rate;
    }

    private class FrankfurterResponse
    {
        public Dictionary<string, decimal> Rates { get; set; } = new();
    }
}