namespace CryptoCompete.Api.Models;

public class Cryptocurrency
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int DecimalPrecision { get; set; } = 8;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
    
    public ICollection<PortfolioHolding> Holdings { get; set; } = new List<PortfolioHolding>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}