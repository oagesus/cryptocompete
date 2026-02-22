namespace CryptoCompete.Api.Services;

public interface ICryptocurrencyListService
{
    Task SyncCryptocurrenciesAsync(CancellationToken cancellationToken = default, bool forceSync = false);
}