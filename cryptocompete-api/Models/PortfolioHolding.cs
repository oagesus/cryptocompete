namespace CryptoCompete.Api.Models;

public class PortfolioHolding
{
    public int Id { get; set; }
    public int ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public int CryptocurrencyId { get; set; }
    public Cryptocurrency Cryptocurrency { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}