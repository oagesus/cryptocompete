namespace CryptoCompete.Api.Services;

public class CryptocurrencyListBackgroundService : BackgroundService
{
    private readonly ICryptocurrencyListService _cryptoListService;
    private readonly ILogger<CryptocurrencyListBackgroundService> _logger;
    private const int SyncHourUtc = 2;

    public CryptocurrencyListBackgroundService(
        ICryptocurrencyListService cryptoListService,
        ILogger<CryptocurrencyListBackgroundService> logger)
    {
        _cryptoListService = cryptoListService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await _cryptoListService.SyncCryptocurrenciesAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTimeOffset.UtcNow;
            var nextRun = new DateTimeOffset(now.Year, now.Month, now.Day, SyncHourUtc, 0, 0, TimeSpan.Zero);
            if (nextRun <= now)
                nextRun = nextRun.AddDays(1);

            var delay = nextRun - now;
            _logger.LogInformation("Next cryptocurrency sync scheduled at {NextRun} UTC (in {Hours}h {Minutes}m)", 
                nextRun, (int)delay.TotalHours, delay.Minutes);

            await Task.Delay(delay, stoppingToken);
            await _cryptoListService.SyncCryptocurrenciesAsync(stoppingToken, forceSync: true);
        }
    }
}