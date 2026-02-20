namespace CryptoCompete.Api.Services;

public interface ILeaderboardService
{
    Task CalculateLeaderboardAsync(CancellationToken cancellationToken = default);
    Task<PaginatedLeaderboard> GetLeaderboardAsync(int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<LeaderboardEntry?> GetEntryByProfileIdAsync(int profileId, CancellationToken cancellationToken = default);
}

public record LeaderboardEntry(
    int Rank,
    Guid ProfilePublicId,
    string Username,
    decimal TotalValue,
    DateTimeOffset CalculatedAt
);

public record PaginatedLeaderboard(
    List<LeaderboardEntry> Entries,
    int TotalCount,
    int Page,
    int PageSize
);