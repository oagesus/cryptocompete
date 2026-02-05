namespace CryptoCompete.Api.Models;

public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Refunded
}

public class SubscriptionPayment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int? SubscriptionId { get; set; }
    public PayPalSubscription? Subscription { get; set; }
    public string PayPalCaptureId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTimeOffset PaidAt { get; set; } = DateTimeOffset.UtcNow;
}