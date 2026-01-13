namespace CryptoCompete.Api.Constants;

public static class SupportedCurrencies
{
    public static readonly HashSet<string> Codes = new(StringComparer.OrdinalIgnoreCase)
    {
        "EUR", "USD", "GBP", "CHF", "JPY", "AUD", "CAD", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF"
    };

    public static bool IsSupported(string code) => Codes.Contains(code);
}