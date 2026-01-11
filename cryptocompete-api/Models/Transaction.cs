namespace CryptoCompete.Api.Models;

public class Transaction
{
    public int Id { get; set; }
    public int ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    public int CryptocurrencyId { get; set; }
    public Cryptocurrency Cryptocurrency { get; set; } = null!;
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal PricePerUnit { get; set; }
    public decimal TotalValue { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum TransactionType
{
    Buy,
    Sell
}