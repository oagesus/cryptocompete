using CryptoCompete.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Services;

public class RefreshTokenCleanupBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupBackgroundService> _logger;
    private static readonly TimeOnly ScheduledTime = new(3, 0);

    public RefreshTokenCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<RefreshTokenCleanupBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var nextRun = now.Date.Add(ScheduledTime.ToTimeSpan());
            if (nextRun <= now)
                nextRun = nextRun.AddDays(1);

            var delay = nextRun - now;
            _logger.LogInformation("Next token cleanup scheduled at {NextRun} UTC", nextRun);
            await Task.Delay(delay, stoppingToken);

            try
            {
                await CleanupExpiredTokens();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up expired refresh tokens");
            }
        }
    }

    private async Task CleanupExpiredTokens()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deleted = await db.RefreshTokens
            .Where(t => t.ExpiresAt < DateTimeOffset.UtcNow)
            .ExecuteDeleteAsync();

        if (deleted > 0)
        {
            _logger.LogInformation("Cleaned up {Count} expired refresh tokens", deleted);
        }
    }
}
