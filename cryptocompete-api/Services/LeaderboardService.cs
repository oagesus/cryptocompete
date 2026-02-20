using CryptoCompete.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Services;

public class LeaderboardService : ILeaderboardService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly CryptoPriceBackgroundService _priceService;
    private readonly ILogger<LeaderboardService> _logger;

    public LeaderboardService(
        IServiceScopeFactory scopeFactory,
        CryptoPriceBackgroundService priceService,
        ILogger<LeaderboardService> logger)
    {
        _scopeFactory = scopeFactory;
        _priceService = priceService;
        _logger = logger;
    }

    public async Task CalculateLeaderboardAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyService>();

            var usdToEur = await currencyService.GetExchangeRateAsync("USD", "EUR");

            var profiles = await db.Profiles
                .Include(p => p.User)
                .Include(p => p.Holdings)
                    .ThenInclude(h => h.Cryptocurrency)
                .Where(p => !p.User.IsBlocked)
                .ToListAsync(cancellationToken);

            var now = DateTimeOffset.UtcNow;
            var leaderboardEntries = new List<Models.LeaderboardSnapshot>();

            foreach (var profile in profiles)
            {
                var holdingsValueEur = profile.Holdings
                    .Where(h => h.Amount > 0)
                    .Sum(h =>
                    {
                        var priceUsd = _priceService.GetPrice(h.Cryptocurrency.Symbol);
                        return priceUsd.HasValue ? h.Amount * priceUsd.Value * usdToEur : 0;
                    });

                var totalValueEur = profile.Balance + holdingsValueEur;

                leaderboardEntries.Add(new Models.LeaderboardSnapshot
                {
                    ProfileId = profile.Id,
                    TotalValue = totalValueEur,
                    CalculatedAt = now
                });
            }

            var existingSnapshots = await db.LeaderboardSnapshots.ToListAsync(cancellationToken);
            db.LeaderboardSnapshots.RemoveRange(existingSnapshots);

            db.LeaderboardSnapshots.AddRange(leaderboardEntries);
            await db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Calculated leaderboard for {Count} profiles", leaderboardEntries.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate leaderboard");
        }
    }

    public async Task<PaginatedLeaderboard> GetLeaderboardAsync(int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var totalCount = await db.LeaderboardSnapshots.CountAsync(cancellationToken);

        var snapshots = await db.LeaderboardSnapshots
            .Include(s => s.Profile)
            .OrderByDescending(s => s.TotalValue)
            .ThenBy(s => s.Profile.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var offset = (page - 1) * pageSize;
        var entries = snapshots
            .Select((s, index) => new LeaderboardEntry(
                offset + index + 1,
                s.Profile.PublicId,
                s.Profile.Username,
                s.TotalValue,
                s.CalculatedAt
            ))
            .ToList();

        return new PaginatedLeaderboard(entries, totalCount, page, pageSize);
    }

    public async Task<LeaderboardEntry?> GetEntryByProfileIdAsync(int profileId, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var rankedSnapshots = await db.LeaderboardSnapshots
            .Include(s => s.Profile)
            .OrderByDescending(s => s.TotalValue)
            .ThenBy(s => s.Profile.CreatedAt)
            .ToListAsync(cancellationToken);

        var entry = rankedSnapshots
            .Select((s, index) => new { Snapshot = s, Rank = index + 1 })
            .FirstOrDefault(x => x.Snapshot.ProfileId == profileId);

        if (entry == null)
            return null;

        return new LeaderboardEntry(
            entry.Rank,
            entry.Snapshot.Profile.PublicId,
            entry.Snapshot.Profile.Username,
            entry.Snapshot.TotalValue,
            entry.Snapshot.CalculatedAt
        );
    }
}