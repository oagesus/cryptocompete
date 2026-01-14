namespace CryptoCompete.Api.Services;

public class CryptocurrencyListBackgroundService : BackgroundService
{
    private readonly ICryptocurrencyListService _cryptoListService;
    private readonly ILogger<CryptocurrencyListBackgroundService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(24);

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
            await Task.Delay(_interval, stoppingToken);
            await _cryptoListService.SyncCryptocurrenciesAsync(stoppingToken);
        }
    }
}