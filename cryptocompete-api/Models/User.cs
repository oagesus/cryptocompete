namespace CryptoCompete.Api.Models;

public class User
{
    public int Id { get; set; }
    public Guid PublicId { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public bool IsBlocked { get; set; }
    public string Timezone { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EmailVerifiedAt { get; set; }

    public int? ActiveProfileId { get; set; }
    public Profile? ActiveProfile { get; set; }
    
    public ICollection<ExternalLogin> ExternalLogins { get; set; } = new List<ExternalLogin>();
    public ICollection<Profile> Profiles { get; set; } = new List<Profile>();
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<PayPalSubscription> PayPalSubscriptions { get; set; } = new List<PayPalSubscription>();
    public ICollection<SubscriptionPayment> SubscriptionPayments { get; set; } = new List<SubscriptionPayment>();
    
    public bool HasPassword => !string.IsNullOrEmpty(PasswordHash);
    public bool HasAnyLoginMethod => HasPassword || ExternalLogins.Any();
}