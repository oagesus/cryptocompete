namespace CryptoCompete.Api.Services;

public class LeaderboardBackgroundService : BackgroundService
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly ILogger<LeaderboardBackgroundService> _logger;

    public LeaderboardBackgroundService(
        ILeaderboardService leaderboardService,
        ILogger<LeaderboardBackgroundService> logger)
    {
        _leaderboardService = leaderboardService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var nextHour = new DateTime(now.Year, now.Month, now.Day, now.Hour, 0, 0, DateTimeKind.Utc).AddHours(1);
            var delay = nextHour - now;

            _logger.LogInformation("Next leaderboard calculation scheduled at {NextRun} (in {Delay})", nextHour, delay);

            await Task.Delay(delay, stoppingToken);
            await _leaderboardService.CalculateLeaderboardAsync(stoppingToken);
        }
    }
}