namespace CryptoCompete.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public bool IsBlocked { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EmailVerifiedAt { get; set; }
    public ICollection<ExternalLogin> ExternalLogins { get; set; } = new List<ExternalLogin>();
    public bool HasPassword => !string.IsNullOrEmpty(PasswordHash);
    public bool HasAnyLoginMethod => HasPassword || ExternalLogins.Any();
}