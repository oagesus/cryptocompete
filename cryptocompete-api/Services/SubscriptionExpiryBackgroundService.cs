using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Services;

public class SubscriptionExpiryBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SubscriptionExpiryBackgroundService> _logger;

    public SubscriptionExpiryBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<SubscriptionExpiryBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckExpiredSubscriptions();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking expired subscriptions");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task CheckExpiredSubscriptions()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var paypal = scope.ServiceProvider.GetRequiredService<IPayPalService>();

        var expiredSubs = await db.PayPalSubscriptions
            .Where(s => s.Status == SubscriptionStatus.Suspended
                && s.CurrentPeriodEnd != null
                && s.CurrentPeriodEnd <= DateTimeOffset.UtcNow)
            .ToListAsync();

        foreach (var sub in expiredSubs)
        {
            try
            {
                await paypal.CancelSubscriptionAsync(sub.PayPalSubscriptionId, "Subscription period expired");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cancel subscription {SubId} at PayPal", sub.PayPalSubscriptionId);
            }

            var premiumRole = await db.UserRoles
                .FirstOrDefaultAsync(r => r.UserId == sub.UserId && r.Role == Role.Premium);

            if (premiumRole != null)
            {
                db.UserRoles.Remove(premiumRole);
                _logger.LogInformation("Revoked Premium role for user {UserId} - subscription period ended", sub.UserId);
            }

            sub.Status = SubscriptionStatus.Expired;
            sub.UpdatedAt = DateTimeOffset.UtcNow;
        }

        if (expiredSubs.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }
}