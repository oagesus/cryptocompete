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

    private static readonly HashSet<string> ExcludedSymbols = new() { "EUR", "1MBABYDOGE", "1000SATS", "1000CHEEMS", "1000CAT" };

    private static readonly Dictionary<string, string> BinanceToCmcSymbolMapping = new()
    {
        { "RONIN", "RON" },
        { "BEAMX", "BEAM" },
        { "BTTC", "BTT" },
        { "VELODROME", "VELO" },
        { "BROCCOLI714", "BROCCOLI" }
    };

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

    public async Task SyncCryptocurrenciesAsync(CancellationToken cancellationToken = default, bool forceSync = false)
    {
        try
        {
            if (!forceSync)
            {
                using var checkScope = _scopeFactory.CreateScope();
                var checkDb = checkScope.ServiceProvider.GetRequiredService<AppDbContext>();
                var lastUpdate = await checkDb.Cryptocurrencies.MaxAsync(c => (DateTimeOffset?)c.UpdatedAt, cancellationToken);
                if (lastUpdate.HasValue && lastUpdate.Value > DateTimeOffset.UtcNow.AddHours(-24))
                {
                    _logger.LogInformation("Skipping CoinMarketCap sync - last sync was {MinutesAgo} minutes ago", 
                        (int)(DateTimeOffset.UtcNow - lastUpdate.Value).TotalMinutes);
                    return;
                }
            }

            var binanceData = await GetBinanceDataAsync(cancellationToken);
            if (binanceData.Count == 0)
                return;

            var binanceSymbols = binanceData.Select(b => b.Symbol).ToHashSet();
            var cmcData = await GetCoinMarketCapDataAsync(cancellationToken);

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var existingCryptos = await db.Cryptocurrencies.ToListAsync(cancellationToken);
            var existingSymbols = existingCryptos.Select(c => c.Symbol).ToHashSet();

            var newBinanceData = binanceData
                .Where(b => !existingSymbols.Contains(b.Symbol))
                .ToList();

            if (newBinanceData.Count > 0)
            {
                var newCryptos = newBinanceData
                    .Select(b =>
                    {
                        var cmc = GetCmcDataForSymbol(b.Symbol, cmcData);
                        return new Cryptocurrency
                        {
                            Symbol = b.Symbol,
                            Name = cmc?.Name ?? b.Symbol,
                            DecimalPrecision = b.Precision,
                            Rank = cmc?.Rank,
                            PercentChange7d = cmc?.PercentChange7d,
                            PercentChange30d = cmc?.PercentChange30d,
                            PercentChange60d = cmc?.PercentChange60d,
                            PercentChange90d = cmc?.PercentChange90d,
                            IsActive = true
                        };
                    })
                    .ToList();

                db.Cryptocurrencies.AddRange(newCryptos);
                await db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Added {Count} new cryptocurrencies", newCryptos.Count);
            }

            if (cmcData.Count > 0)
            {
                await UpdateFromCmcAsync(db, existingCryptos, cmcData, cancellationToken);
            }

            var toDeactivate = existingCryptos
                .Where(c => c.IsActive && !binanceSymbols.Contains(c.Symbol))
                .ToList();

            if (toDeactivate.Count > 0)
            {
                var deactivatedIds = toDeactivate.Select(c => c.Id).ToList();

                foreach (var crypto in toDeactivate)
                {
                    crypto.IsActive = false;
                    crypto.DeactivatedAt = DateTimeOffset.UtcNow;
                }

                var alarmsToMark = await db.PriceAlarms
                    .Where(a => deactivatedIds.Contains(a.CryptocurrencyId) && !a.IsDelisted)
                    .ToListAsync(cancellationToken);

                if (alarmsToMark.Count > 0)
                {
                    foreach (var alarm in alarmsToMark)
                    {
                        alarm.IsDelisted = true;
                    }
                    _logger.LogInformation("Marked {Count} price alarms as delisted", alarmsToMark.Count);
                }

                await db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Deactivated {Count} cryptocurrencies", toDeactivate.Count);
            }

            var toActivate = existingCryptos
                .Where(c => !c.IsActive && binanceSymbols.Contains(c.Symbol))
                .ToList();

            if (toActivate.Count > 0)
            {
                var reactivatedIds = toActivate.Select(c => c.Id).ToList();

                foreach (var crypto in toActivate)
                {
                    crypto.IsActive = true;
                    crypto.DeactivatedAt = null;
                }

                var alarmsToReactivate = await db.PriceAlarms
                    .Where(a => reactivatedIds.Contains(a.CryptocurrencyId) && a.IsDelisted)
                    .ToListAsync(cancellationToken);

                if (alarmsToReactivate.Count > 0)
                {
                    foreach (var alarm in alarmsToReactivate)
                    {
                        alarm.IsDelisted = false;
                    }
                    _logger.LogInformation("Reactivated {Count} price alarms", alarmsToReactivate.Count);
                }

                await db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Reactivated {Count} cryptocurrencies", toActivate.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync cryptocurrencies");
        }
    }

    private static CoinMarketCapData? GetCmcDataForSymbol(string binanceSymbol, Dictionary<string, CoinMarketCapData> cmcData)
    {
        var upperSymbol = binanceSymbol.ToUpperInvariant();
        
        if (cmcData.TryGetValue(upperSymbol, out var data))
            return data;

        if (BinanceToCmcSymbolMapping.TryGetValue(binanceSymbol, out var cmcSymbol) && 
            cmcData.TryGetValue(cmcSymbol.ToUpperInvariant(), out var mappedData))
            return mappedData;

        return null;
    }

    private async Task UpdateFromCmcAsync(
        AppDbContext db, 
        List<Cryptocurrency> existingCryptos, 
        Dictionary<string, CoinMarketCapData> cmcData, 
        CancellationToken cancellationToken)
    {
        var updated = 0;
        
        foreach (var crypto in existingCryptos)
        {
            var cmc = GetCmcDataForSymbol(crypto.Symbol, cmcData);
            if (cmc != null)
            {
                crypto.Name = cmc.Name;
                crypto.Rank = cmc.Rank;
                crypto.PercentChange7d = cmc.PercentChange7d;
                crypto.PercentChange30d = cmc.PercentChange30d;
                crypto.PercentChange60d = cmc.PercentChange60d;
                crypto.PercentChange90d = cmc.PercentChange90d;
                crypto.UpdatedAt = DateTimeOffset.UtcNow;
                updated++;
            }
        }
        
        if (updated > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Updated ranks and percent changes for {Count} cryptocurrencies", updated);
        }
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

    private async Task<Dictionary<string, CoinMarketCapData>> GetCoinMarketCapDataAsync(CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(_coinMarketCapApiKey))
            {
                _logger.LogWarning("CoinMarketCap API key not configured");
                return new Dictionary<string, CoinMarketCapData>();
            }

            var allData = new List<CoinMarketCapListing>();

            var firstBatch = await FetchCmcListingsAsync(1, 5000, cancellationToken);
            allData.AddRange(firstBatch);

            var secondBatch = await FetchCmcListingsAsync(5001, 5000, cancellationToken);
            allData.AddRange(secondBatch);

            _logger.LogInformation("Fetched {Count} cryptocurrencies from CoinMarketCap", allData.Count);

            return allData
                .GroupBy(c => c.Symbol.ToUpperInvariant())
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var best = g.OrderBy(c => c.CmcRank ?? int.MaxValue).First();
                        var quote = best.Quote?.GetValueOrDefault("USD");
                        return new CoinMarketCapData(
                            best.Name, 
                            best.CmcRank,
                            quote?.PercentChange7d,
                            quote?.PercentChange30d,
                            quote?.PercentChange60d,
                            quote?.PercentChange90d
                        );
                    }
                );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch CoinMarketCap data");
            return new Dictionary<string, CoinMarketCapData>();
        }
    }

    private async Task<List<CoinMarketCapListing>> FetchCmcListingsAsync(int start, int limit, CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, 
            $"https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start={start}&limit={limit}");
        request.Headers.Add("X-CMC_PRO_API_KEY", _coinMarketCapApiKey);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<CoinMarketCapListingsResponse>(cancellationToken);
        return result?.Data ?? new List<CoinMarketCapListing>();
    }

    private record CoinMarketCapData(
        string Name, 
        int? Rank, 
        decimal? PercentChange7d,
        decimal? PercentChange30d,
        decimal? PercentChange60d,
        decimal? PercentChange90d
    );

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

    private class CoinMarketCapListingsResponse
    {
        [JsonPropertyName("data")]
        public List<CoinMarketCapListing> Data { get; set; } = new();
    }

    private class CoinMarketCapListing
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;
        
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("cmc_rank")]
        public int? CmcRank { get; set; }
        
        [JsonPropertyName("quote")]
        public Dictionary<string, CoinMarketCapQuote>? Quote { get; set; }
    }

    private class CoinMarketCapQuote
    {
        [JsonPropertyName("price")]
        public decimal? Price { get; set; }
        
        [JsonPropertyName("percent_change_24h")]
        public decimal? PercentChange24h { get; set; }
        
        [JsonPropertyName("percent_change_7d")]
        public decimal? PercentChange7d { get; set; }
        
        [JsonPropertyName("percent_change_30d")]
        public decimal? PercentChange30d { get; set; }
        
        [JsonPropertyName("percent_change_60d")]
        public decimal? PercentChange60d { get; set; }
        
        [JsonPropertyName("percent_change_90d")]
        public decimal? PercentChange90d { get; set; }
    }
}