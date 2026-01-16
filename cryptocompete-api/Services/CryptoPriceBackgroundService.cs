using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CryptoCompete.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CryptoCompete.Api.Services;

public class CryptoPriceBackgroundService : BackgroundService
{
    private readonly IHubContext<CryptoPriceHub> _hubContext;
    private readonly ILogger<CryptoPriceBackgroundService> _logger;
    private readonly ConcurrentDictionary<string, PriceUpdate> _prices = new();
    private readonly ConcurrentDictionary<string, PriceUpdate> _pendingUpdates = new();
    private ClientWebSocket? _webSocket;

    public CryptoPriceBackgroundService(
        IHubContext<CryptoPriceHub> hubContext,
        ILogger<CryptoPriceBackgroundService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _ = BroadcastPricesAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ConnectAndReceiveAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WebSocket connection error. Reconnecting in 1 second...");
                await Task.Delay(1000, stoppingToken);
            }
        }
    }

    private async Task BroadcastPricesAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(1000, stoppingToken);

            var updates = _pendingUpdates.ToArray();
            _pendingUpdates.Clear();

            foreach (var kvp in updates)
            {
                var priceUpdate = kvp.Value;
                await _hubContext.Clients.Group(priceUpdate.Symbol).SendAsync("PriceUpdate", priceUpdate, stoppingToken);
            }
        }
    }

    private async Task ConnectAndReceiveAsync(CancellationToken stoppingToken)
    {
        _webSocket = new ClientWebSocket();
        _webSocket.Options.KeepAliveInterval = TimeSpan.FromSeconds(30);
        var uri = new Uri("wss://stream.binance.com:9443/ws/!ticker@arr");

        _logger.LogInformation("Connecting to Binance WebSocket...");
        await _webSocket.ConnectAsync(uri, stoppingToken);
        _logger.LogInformation("Connected to Binance WebSocket");

        var buffer = new byte[1024 * 64];
        var messageBuffer = new StringBuilder();

        while (_webSocket.State == WebSocketState.Open && !stoppingToken.IsCancellationRequested)
        {
            var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), stoppingToken);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                _logger.LogWarning("Binance WebSocket closed by server");
                break;
            }

            var chunk = Encoding.UTF8.GetString(buffer, 0, result.Count);
            messageBuffer.Append(chunk);

            if (result.EndOfMessage)
            {
                var message = messageBuffer.ToString();
                messageBuffer.Clear();
                ProcessMessage(message);
            }
        }
    }

    private void ProcessMessage(string message)
    {
        try
        {
            var tickers = JsonSerializer.Deserialize<List<BinanceTicker>>(message);
            if (tickers == null) return;

            foreach (var ticker in tickers)
            {
                if (!ticker.Symbol.EndsWith("USDT")) continue;

                var symbol = ticker.Symbol.Replace("USDT", "");
                
                if (!decimal.TryParse(ticker.LastPrice, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var price)) continue;
                if (!decimal.TryParse(ticker.PriceChangePercent, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var changePercent)) continue;

                var priceUpdate = new PriceUpdate(symbol, price, changePercent);
                
                _prices[symbol] = priceUpdate;
                _pendingUpdates[symbol] = priceUpdate;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Binance message: {Message}", message[..Math.Min(100, message.Length)]);
        }
    }

    public decimal? GetPrice(string symbol)
    {
        return _prices.TryGetValue(symbol.ToUpperInvariant(), out var update) ? update.Price : null;
    }

    public decimal? GetChangePercent24h(string symbol)
    {
        return _prices.TryGetValue(symbol.ToUpperInvariant(), out var update) ? update.ChangePercent24h : null;
    }

    public Dictionary<string, decimal> GetAllPrices()
    {
        return _prices.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Price);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_webSocket?.State == WebSocketState.Open)
        {
            await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Shutting down", cancellationToken);
        }
        _webSocket?.Dispose();
        await base.StopAsync(cancellationToken);
    }

    private class BinanceTicker
    {
        [JsonPropertyName("e")]
        public string EventType { get; set; } = string.Empty;

        [JsonPropertyName("s")]
        public string Symbol { get; set; } = string.Empty;

        [JsonPropertyName("c")]
        public string LastPrice { get; set; } = string.Empty;

        [JsonPropertyName("P")]
        public string PriceChangePercent { get; set; } = string.Empty;
    }
}

public record PriceUpdate(string Symbol, decimal Price, decimal ChangePercent24h);