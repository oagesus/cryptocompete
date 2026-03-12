namespace CryptoCompete.Api.Services;

public interface ITurnstileService
{
    Task<bool> ValidateTokenAsync(string token);
}
