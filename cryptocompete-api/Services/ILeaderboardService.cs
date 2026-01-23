namespace CryptoCompete.Api.Services;

public interface ILeaderboardService
{
    Task CalculateLeaderboardAsync(CancellationToken cancellationToken = default);
    Task<List<LeaderboardEntry>> GetLeaderboardAsync(int limit = 100, CancellationToken cancellationToken = default);
}

public record LeaderboardEntry(
    int Rank,
    Guid ProfilePublicId,
    string Username,
    decimal TotalValue,
    DateTimeOffset CalculatedAt
);