namespace CryptoCompete.Api.Models;

public class Profile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Username { get; set; } = string.Empty;
    public bool IsMain { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}