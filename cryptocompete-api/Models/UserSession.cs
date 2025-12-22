namespace CryptoCompete.Api.Models;

public class UserSession
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string? DeviceInfo { get; set; }
    public DateTimeOffset LoggedInAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastActivityAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LoggedOutAt { get; set; }
}