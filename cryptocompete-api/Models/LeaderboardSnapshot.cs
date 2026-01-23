namespace CryptoCompete.Api.Models;

public class LeaderboardSnapshot
{
    public int Id { get; set; }
    public int ProfileId { get; set; }
    public decimal TotalValue { get; set; }
    public DateTimeOffset CalculatedAt { get; set; }

    public Profile Profile { get; set; } = null!;
}