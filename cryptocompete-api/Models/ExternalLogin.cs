namespace CryptoCompete.Api.Models;

public class ExternalLogin
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Provider { get; set; } = string.Empty;
    public string ProviderSubjectId { get; set; } = string.Empty;
    public string? ProviderEmail { get; set; }
    public string? ProviderDisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public static class ExternalLoginProviders
{
    public const string Google = "Google";
    public const string GitHub = "GitHub";
    public const string Apple = "Apple";
    public const string Microsoft = "Microsoft";
}