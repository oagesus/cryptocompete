namespace CryptoCompete.Api.Models;

public enum SubscriptionStatus
{
    Pending,
    Active,
    Suspended,
    Cancelled,
    Expired
}

public class PayPalSubscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string PayPalSubscriptionId { get; set; } = string.Empty;
    public string PayPalPlanId { get; set; } = string.Empty;
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Pending;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public DateTimeOffset? CurrentPeriodStart { get; set; }
    public DateTimeOffset? CurrentPeriodEnd { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}