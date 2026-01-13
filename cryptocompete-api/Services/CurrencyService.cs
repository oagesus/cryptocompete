using Microsoft.Extensions.Caching.Memory;

namespace CryptoCompete.Api.Services;

public class CurrencyService : ICurrencyService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromHours(24);

    public CurrencyService(HttpClient httpClient, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _cache = cache;
    }

    public async Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency)
    {
        if (fromCurrency == toCurrency)
            return 1m;

        var rates = await GetExchangeRatesAsync(fromCurrency, new[] { toCurrency });
        return rates.TryGetValue(toCurrency, out var rate) ? rate : 1m;
    }

    public async Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string fromCurrency, IEnumerable<string> toCurrencies)
    {
        var cacheKey = $"rates_{fromCurrency}";

        if (_cache.TryGetValue<Dictionary<string, decimal>>(cacheKey, out var cachedRates) && cachedRates != null)
        {
            return cachedRates
                .Where(r => toCurrencies.Contains(r.Key))
                .ToDictionary(r => r.Key, r => r.Value);
        }

        try
        {
            var response = await _httpClient.GetFromJsonAsync<FrankfurterResponse>(
                $"https://api.frankfurter.app/latest?from={fromCurrency}");

            if (response?.Rates != null)
            {
                _cache.Set(cacheKey, response.Rates, _cacheDuration);

                return response.Rates
                    .Where(r => toCurrencies.Contains(r.Key))
                    .ToDictionary(r => r.Key, r => r.Value);
            }
        }
        catch
        {
        }

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