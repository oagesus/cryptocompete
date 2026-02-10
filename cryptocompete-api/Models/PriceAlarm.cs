namespace CryptoCompete.Api.Models;

public class PriceAlarm
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int CryptocurrencyId { get; set; }
    public Cryptocurrency Cryptocurrency { get; set; } = null!;
    public decimal TargetPrice { get; set; }
    public string Currency { get; set; } = null!;
    public bool IsAbove { get; set; }
    public bool IsRecurring { get; set; }
    public bool IsTriggered { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? TriggeredAt { get; set; }
}