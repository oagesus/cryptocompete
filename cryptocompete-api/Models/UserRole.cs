namespace CryptoCompete.Api.Models;

public enum Role
{
    Free = 0,
    Premium = 1,
    Admin = 10
}

public class UserRole
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public Role Role { get; set; } = Role.Free;
    public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;
}