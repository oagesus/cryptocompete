namespace CryptoCompete.Api.Services;

public interface ICurrencyService
{
    Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency);
    Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string fromCurrency, IEnumerable<string> toCurrencies);
    Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency);
}