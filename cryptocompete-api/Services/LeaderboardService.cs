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

    public async Task<List<LeaderboardEntry>> GetLeaderboardAsync(int limit = 100, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var snapshots = await db.LeaderboardSnapshots
            .Include(s => s.Profile)
            .OrderByDescending(s => s.TotalValue)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return snapshots
            .Select((s, index) => new LeaderboardEntry(
                index + 1,
                s.Profile.PublicId,
                s.Profile.Username,
                s.TotalValue,
                s.CalculatedAt
            ))
            .ToList();
    }
}