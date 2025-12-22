namespace CryptoCompete.Api.Models;

public class PasswordResetToken
{
    public int Id { get; set; }
    public Guid Token { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddHours(1);
    public bool IsUsed { get; set; } = false;
}