using System.Text;
using System.Text.Json.Serialization;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Services;

public class CryptocurrencyListService : ICryptocurrencyListService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HttpClient _httpClient;
    private readonly ILogger<CryptocurrencyListService> _logger;
    private readonly string? _coinMarketCapApiKey;

    private static readonly HashSet<string> ExcludedSymbols = new() { "EUR" };

    public CryptocurrencyListService(
        IServiceScopeFactory scopeFactory,
        HttpClient httpClient,
        ILogger<CryptocurrencyListService> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _httpClient = httpClient;
        _logger = logger;
        _coinMarketCapApiKey = configuration["CoinMarketCap:ApiKey"];
    }

    public async Task SyncCryptocurrenciesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var binanceData = await GetBinanceDataAsync(cancellationToken);
            if (binanceData.Count == 0)
                return;

            var binanceSymbols = binanceData.Select(b => b.Symbol).ToHashSet();

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var existingCryptos = await db.Cryptocurrencies.ToListAsync(cancellationToken);
            var existingSymbols = existingCryptos.Select(c => c.Symbol).ToHashSet();

            var newBinanceData = binanceData
                .Where(b => !existingSymbols.Contains(b.Symbol))
                .ToList();

            if (newBinanceData.Count > 0)
            {
                var cmcNames = await GetCoinMarketCapNamesAsync(cancellationToken);

                var newCryptos = newBinanceData
                    .Select(b => new Cryptocurrency
                    {
                        Symbol = b.Symbol,
                        Name = cmcNames.GetValueOrDefault(b.Symbol, b.Symbol),
                        DecimalPrecision = b.Precision,
                        IsActive = true
                    })
                    .ToList();

                await BulkInsertAsync(db, newCryptos, cancellationToken);
                _logger.LogInformation("Added {Count} new cryptocurrencies", newCryptos.Count);
            }

            var toDeactivate = existingCryptos
                .Where(c => c.IsActive && !binanceSymbols.Contains(c.Symbol))
                .Select(c => c.Symbol)
                .ToList();

            if (toDeactivate.Count > 0)
            {
                await BulkUpdateIsActiveAsync(db, toDeactivate, false, cancellationToken);
                _logger.LogInformation("Deactivated {Count} cryptocurrencies", toDeactivate.Count);
            }

            var toActivate = existingCryptos
                .Where(c => !c.IsActive && binanceSymbols.Contains(c.Symbol))
                .Select(c => c.Symbol)
                .ToList();

            if (toActivate.Count > 0)
            {
                await BulkUpdateIsActiveAsync(db, toActivate, true, cancellationToken);
                _logger.LogInformation("Reactivated {Count} cryptocurrencies", toActivate.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync cryptocurrencies");
        }
    }

    private async Task BulkInsertAsync(AppDbContext db, List<Cryptocurrency> cryptos, CancellationToken cancellationToken)
    {
        var sb = new StringBuilder();
        sb.Append("INSERT INTO cryptocurrencies (symbol, name, decimal_precision, is_active, added_at) VALUES ");

        var parameters = new List<object>();
        for (int i = 0; i < cryptos.Count; i++)
        {
            if (i > 0) sb.Append(", ");
            var paramIndex = i * 5;
            sb.Append($"(@p{paramIndex}, @p{paramIndex + 1}, @p{paramIndex + 2}, @p{paramIndex + 3}, @p{paramIndex + 4})");
            
            parameters.Add(cryptos[i].Symbol);
            parameters.Add(cryptos[i].Name);
            parameters.Add(cryptos[i].DecimalPrecision);
            parameters.Add(cryptos[i].IsActive);
            parameters.Add(DateTimeOffset.UtcNow);
        }

        await db.Database.ExecuteSqlRawAsync(sb.ToString(), parameters, cancellationToken);
    }

    private async Task BulkUpdateIsActiveAsync(AppDbContext db, List<string> symbols, bool isActive, CancellationToken cancellationToken)
    {
        var symbolParams = string.Join(", ", symbols.Select((_, i) => $"@p{i + 1}"));
        var sql = $"UPDATE cryptocurrencies SET is_active = @p0 WHERE symbol IN ({symbolParams})";
        
        var parameters = new List<object> { isActive };
        parameters.AddRange(symbols);

        await db.Database.ExecuteSqlRawAsync(sql, parameters, cancellationToken);
    }

    private async Task<List<BinanceCryptoData>> GetBinanceDataAsync(CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.GetFromJsonAsync<BinanceExchangeInfo>(
                "https://api.binance.com/api/v3/exchangeInfo",
                cancellationToken);

            if (response?.Symbols == null)
                return new List<BinanceCryptoData>();

            return response.Symbols
                .Where(s => s.QuoteAsset == "USDT" && s.Status == "TRADING")
                .Where(s => !ExcludedSymbols.Contains(s.BaseAsset))
                .GroupBy(s => s.BaseAsset)
                .Select(g => new BinanceCryptoData
                {
                    Symbol = g.Key,
                    Precision = g.First().BaseAssetPrecision
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Binance data");
            return new List<BinanceCryptoData>();
        }
    }

    private async Task<Dictionary<string, string>> GetCoinMarketCapNamesAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(_coinMarketCapApiKey))
            {
                _logger.LogWarning("CoinMarketCap API key not configured");
                return new Dictionary<string, string>();
            }

            var request = new HttpRequestMessage(HttpMethod.Get, 
                "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?limit=5000");
            request.Headers.Add("X-CMC_PRO_API_KEY", _coinMarketCapApiKey);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<CoinMarketCapResponse>(cancellationToken);

            if (result?.Data == null)
                return new Dictionary<string, string>();

            return result.Data
                .Where(c => c.IsActive == 1)
                .GroupBy(c => c.Symbol)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(c => c.Rank ?? int.MaxValue).First().Name
                );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch CoinMarketCap names");
            return new Dictionary<string, string>();
        }
    }

    private class BinanceCryptoData
    {
        public string Symbol { get; set; } = string.Empty;
        public int Precision { get; set; }
    }

    private class BinanceExchangeInfo
    {
        [JsonPropertyName("symbols")]
        public List<BinanceSymbol> Symbols { get; set; } = new();
    }

    private class BinanceSymbol
    {
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;
        
        [JsonPropertyName("baseAsset")]
        public string BaseAsset { get; set; } = string.Empty;
        
        [JsonPropertyName("quoteAsset")]
        public string QuoteAsset { get; set; } = string.Empty;
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
        
        [JsonPropertyName("baseAssetPrecision")]
        public int BaseAssetPrecision { get; set; }
    }

    private class CoinMarketCapResponse
    {
        [JsonPropertyName("data")]
        public List<CoinMarketCapName> Data { get; set; } = new();
    }

    private class CoinMarketCapName
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;
        
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("is_active")]
        public int IsActive { get; set; }
        
        [JsonPropertyName("rank")]
        public int? Rank { get; set; }
    }
}