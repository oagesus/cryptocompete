using System.Security.Claims;
using System.Text.Json;
using CryptoCompete.Api.Data;
using CryptoCompete.Api.Models;
using CryptoCompete.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CryptoCompete.Api.Controllers;

[ApiController]
[Route("api/subscription")]
public class SubscriptionController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPayPalService _paypal;
    private readonly IConfiguration _config;
    private readonly ILogger<SubscriptionController> _logger;
    private readonly bool _isDevelopment;

    public SubscriptionController(
        AppDbContext db,
        IPayPalService paypal,
        IConfiguration config,
        ILogger<SubscriptionController> logger,
        IWebHostEnvironment environment)
    {
        _db = db;
        _paypal = paypal;
        _config = config;
        _logger = logger;
        _isDevelopment = environment.IsDevelopment();
    }

    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> CreateSubscription()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var activeSub = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);
        if (activeSub != null)
            return BadRequest(new { message = "You already have an active subscription" });

        var frontendUrl = _config["FrontendUrl"]!;
        var planId = _config["PayPal:PlanId"]!;

        var result = await _paypal.CreateSubscriptionAsync(
            planId,
            $"{frontendUrl}/dashboard?subscription=success",
            $"{frontendUrl}/dashboard?subscription=cancelled");

        var planDetails = await _paypal.GetPlanDetailsAsync(planId);
        var (amount, currency) = planDetails.GetRegularPrice();

        var subscription = new PayPalSubscription
        {
            UserId = userId.Value,
            PayPalSubscriptionId = result.Id,
            PayPalPlanId = planId,
            Status = SubscriptionStatus.Pending,
            Amount = amount,
            Currency = currency
        };

        _db.PayPalSubscriptions.Add(subscription);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            subscriptionId = result.Id,
            approveUrl = result.ApproveUrl
        });
    }

    [Authorize]
    [HttpPost("activate")]
    public async Task<IActionResult> ActivateSubscription([FromBody] ActivateSubscriptionRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.PayPalSubscriptionId == request.SubscriptionId && s.UserId == userId);

        if (subscription == null)
            return NotFound(new { message = "Subscription not found" });

        var details = await _paypal.GetSubscriptionDetailsAsync(request.SubscriptionId);

        subscription.Status = MapPayPalStatus(details.Status);
        subscription.UpdatedAt = DateTimeOffset.UtcNow;

        if (DateTimeOffset.TryParse(details.StartTime, out var startTime))
            subscription.CurrentPeriodStart = startTime;

        if (details.BillingInfo?.NextBillingTime != null
            && DateTimeOffset.TryParse(details.BillingInfo.NextBillingTime, out var nextBilling))
            subscription.CurrentPeriodEnd = nextBilling;

        if (subscription.Status == SubscriptionStatus.Active)
        {
            await GrantPremiumRoleAsync(userId.Value);
        }

        await _db.SaveChangesAsync();

        return Ok(new { status = subscription.Status.ToString() });
    }

    [Authorize]
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscription()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

        if (subscription == null)
            return NotFound(new { message = "No active subscription found" });

        try
        {
            await _paypal.SuspendSubscriptionAsync(subscription.PayPalSubscriptionId, "User requested cancellation");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "PayPal suspend failed for {SubId}, verifying current status", subscription.PayPalSubscriptionId);

            var details = await _paypal.GetSubscriptionDetailsAsync(subscription.PayPalSubscriptionId);
            var confirmedStatus = MapPayPalStatus(details.Status);

            if (confirmedStatus != SubscriptionStatus.Suspended)
                return BadRequest(new { message = "Failed to cancel subscription. Please try again." });
        }

        var now = DateTimeOffset.UtcNow;
        var updated = await _db.PayPalSubscriptions
            .Where(s => s.Id == subscription.Id && s.Status == SubscriptionStatus.Active)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.Status, SubscriptionStatus.Suspended)
                .SetProperty(x => x.CancelledAt, now)
                .SetProperty(x => x.UpdatedAt, now));

        if (updated == 0)
        {
            _logger.LogWarning("Concurrent cancel for subscription {SubId} - already processed", subscription.PayPalSubscriptionId);
            return Conflict(new { message = "Subscription was already cancelled" });
        }

        return Ok(new
        {
            message = "Subscription cancelled",
            activeUntil = subscription.CurrentPeriodEnd
        });
    }

    [Authorize]
    [HttpPost("abandon")]
    public async Task<IActionResult> AbandonSubscription([FromBody] AbandonSubscriptionRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.PayPalSubscriptionId == request.SubscriptionId
                && s.UserId == userId
                && s.Status == SubscriptionStatus.Pending);

        if (subscription == null)
            return NotFound(new { message = "No pending subscription found" });

        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.CancelledAt = DateTimeOffset.UtcNow;
        subscription.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Subscription abandoned" });
    }

    [Authorize]
    [HttpPost("resubscribe")]
    public async Task<IActionResult> Resubscribe()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId
                && s.Status == SubscriptionStatus.Suspended
                && s.CurrentPeriodEnd != null
                && s.CurrentPeriodEnd > DateTimeOffset.UtcNow);

        if (subscription == null)
            return NotFound(new { message = "No suspended subscription eligible for resubscription" });

        var details = await _paypal.GetSubscriptionDetailsAsync(subscription.PayPalSubscriptionId);
        var paypalStatus = details.Status.ToUpperInvariant();

        if (paypalStatus == "CANCELLED")
            return BadRequest(new { message = "This subscription was cancelled via PayPal and cannot be reactivated. You can subscribe again after your current period ends." });

        if (paypalStatus != "SUSPENDED")
            return BadRequest(new { message = "Cannot reactivate subscription. PayPal status: " + details.Status });

        bool activatedSuccessfully = false;

        try
        {
            await _paypal.ActivateSubscriptionAsync(subscription.PayPalSubscriptionId, "User requested resubscription");
            activatedSuccessfully = true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "PayPal activate failed for {SubId}", subscription.PayPalSubscriptionId);
        }

        if (!activatedSuccessfully)
            return BadRequest(new { message = "Failed to reactivate subscription. Please try again." });

        var now = DateTimeOffset.UtcNow;
        var updated = await _db.PayPalSubscriptions
            .Where(s => s.Id == subscription.Id && s.Status == SubscriptionStatus.Suspended)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.Status, SubscriptionStatus.Active)
                .SetProperty(x => x.CancelledAt, (DateTimeOffset?)null)
                .SetProperty(x => x.UpdatedAt, now));

        if (updated == 0)
            return Conflict(new { message = "Subscription was already reactivated" });

        await GrantPremiumRoleAsync(userId.Value);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Subscription reactivated" });
    }

    [Authorize]
    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var subscription = await _db.PayPalSubscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        decimal? planAmount = subscription?.Amount;
        string? planCurrency = subscription?.Currency;

        if (planAmount == null || planAmount == 0)
        {
            try
            {
                var planId = _config["PayPal:PlanId"]!;
                var planDetails = await _paypal.GetPlanDetailsAsync(planId);
                var (amount, currency) = planDetails.GetRegularPrice();
                planAmount = amount;
                planCurrency = currency;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch plan details from PayPal");
            }
        }

        var isCancelledButActive = subscription?.Status == SubscriptionStatus.Suspended
            && subscription.CurrentPeriodEnd != null
            && subscription.CurrentPeriodEnd > DateTimeOffset.UtcNow;

        var canResubscribe = false;
        if (isCancelledButActive)
        {
            try
            {
                var details = await _paypal.GetSubscriptionDetailsAsync(subscription!.PayPalSubscriptionId);
                canResubscribe = details.Status.Equals("SUSPENDED", StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to check PayPal status for resubscribe eligibility");
                canResubscribe = false;
            }
        }

        return Ok(new
        {
            hasSubscription = subscription != null,
            status = subscription?.Status.ToString(),
            currentPeriodEnd = subscription?.CurrentPeriodEnd,
            cancelledAt = subscription?.CancelledAt,
            cancelledButActive = isCancelledButActive,
            canResubscribe,
            activeUntil = isCancelledButActive ? subscription!.CurrentPeriodEnd : null,
            planAmount,
            planCurrency
        });
    }

    // ── Webhook ─────────────────────────────────────────────────

    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook()
    {
        string body;
        using (var reader = new StreamReader(Request.Body))
            body = await reader.ReadToEndAsync();

        var isValid = _isDevelopment || await _paypal.VerifyWebhookSignatureAsync(Request.Headers, body);
        if (!isValid)
        {
            _logger.LogWarning("Invalid PayPal webhook signature");
            return BadRequest();
        }

        var json = JsonDocument.Parse(body);
        var eventType = json.RootElement.GetProperty("event_type").GetString();
        var resource = json.RootElement.GetProperty("resource");

        _logger.LogInformation("PayPal webhook received: {EventType}", eventType);

        switch (eventType)
        {
            case "BILLING.SUBSCRIPTION.ACTIVATED":
                await HandleSubscriptionActivated(resource);
                break;
            case "BILLING.SUBSCRIPTION.CANCELLED":
                await HandleSubscriptionCancelled(resource);
                break;
            case "BILLING.SUBSCRIPTION.SUSPENDED":
                await HandleSubscriptionSuspended(resource);
                break;
            case "BILLING.SUBSCRIPTION.EXPIRED":
                await HandleSubscriptionExpired(resource);
                break;
            case "PAYMENT.SALE.COMPLETED":
                await HandlePaymentCompleted(resource);
                break;
            case "PAYMENT.SALE.REFUNDED":
                await HandlePaymentRefunded(resource);
                break;
        }

        return Ok();
    }

    // ── Webhook Handlers ────────────────────────────────────────

    private static DateTimeOffset? GetWebhookEventTime(JsonElement resource)
    {
        if (resource.TryGetProperty("status_update_time", out var t) && DateTimeOffset.TryParse(t.GetString(), out var dt))
            return dt;
        if (resource.TryGetProperty("update_time", out t) && DateTimeOffset.TryParse(t.GetString(), out dt))
            return dt;
        if (resource.TryGetProperty("create_time", out t) && DateTimeOffset.TryParse(t.GetString(), out dt))
            return dt;
        return null;
    }

    private async Task HandleSubscriptionActivated(JsonElement resource)
    {
        var subId = resource.GetProperty("id").GetString()!;
        var eventTime = GetWebhookEventTime(resource);

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.PayPalSubscriptionId == subId);

        if (subscription == null) return;

        if (subscription.Status == SubscriptionStatus.Active) return;

        if (eventTime.HasValue && eventTime.Value < subscription.UpdatedAt)
        {
            _logger.LogInformation("Ignoring stale ACTIVATED webhook for {SubId} (event: {EventTime}, local: {UpdatedAt})",
                subId, eventTime.Value, subscription.UpdatedAt);
            return;
        }

        try
        {
            var details = await _paypal.GetSubscriptionDetailsAsync(subId);

            if (details.BillingInfo?.NextBillingTime != null
                && DateTimeOffset.TryParse(details.BillingInfo.NextBillingTime, out var nextBilling))
            {
                subscription.CurrentPeriodStart = subscription.CurrentPeriodEnd ?? DateTimeOffset.UtcNow;
                subscription.CurrentPeriodEnd = nextBilling;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch subscription details for {SubId} during activation", subId);
        }

        subscription.Status = SubscriptionStatus.Active;
        subscription.CancelledAt = null;
        subscription.UpdatedAt = DateTimeOffset.UtcNow;

        await GrantPremiumRoleAsync(subscription.UserId);
        await _db.SaveChangesAsync();
    }

    private async Task HandleSubscriptionCancelled(JsonElement resource)
    {
        var subId = resource.GetProperty("id").GetString()!;
        var eventTime = GetWebhookEventTime(resource);

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.PayPalSubscriptionId == subId);

        if (subscription == null) return;

        if (eventTime.HasValue && eventTime.Value < subscription.UpdatedAt)
        {
            _logger.LogInformation("Ignoring stale CANCELLED webhook for {SubId} (event: {EventTime}, local: {UpdatedAt})",
                subId, eventTime.Value, subscription.UpdatedAt);
            return;
        }

        subscription.CancelledAt ??= DateTimeOffset.UtcNow;
        subscription.UpdatedAt = DateTimeOffset.UtcNow;

        if (subscription.CurrentPeriodEnd != null && subscription.CurrentPeriodEnd > DateTimeOffset.UtcNow)
        {
            subscription.Status = SubscriptionStatus.Suspended;
            _logger.LogInformation("Subscription {SubId} cancelled via PayPal with time remaining until {PeriodEnd} - keeping Premium access",
                subId, subscription.CurrentPeriodEnd);
        }
        else
        {
            subscription.Status = SubscriptionStatus.Cancelled;
            await RevokePremiumRoleAsync(subscription.UserId);
        }

        await _db.SaveChangesAsync();
    }

    private async Task HandleSubscriptionSuspended(JsonElement resource)
    {
        var subId = resource.GetProperty("id").GetString()!;
        var eventTime = GetWebhookEventTime(resource);

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.PayPalSubscriptionId == subId);

        if (subscription == null) return;

        if (eventTime.HasValue && eventTime.Value < subscription.UpdatedAt)
        {
            _logger.LogInformation("Ignoring stale SUSPENDED webhook for {SubId} (event: {EventTime}, local: {UpdatedAt})",
                subId, eventTime.Value, subscription.UpdatedAt);
            return;
        }

        subscription.Status = SubscriptionStatus.Suspended;
        subscription.CancelledAt ??= DateTimeOffset.UtcNow;
        subscription.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
    }

    private async Task HandleSubscriptionExpired(JsonElement resource)
    {
        var subId = resource.GetProperty("id").GetString()!;

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.PayPalSubscriptionId == subId);

        if (subscription == null) return;

        subscription.Status = SubscriptionStatus.Expired;
        subscription.UpdatedAt = DateTimeOffset.UtcNow;

        await RevokePremiumRoleAsync(subscription.UserId);
        await _db.SaveChangesAsync();
    }

    private async Task HandlePaymentCompleted(JsonElement resource)
    {
        var billingAgreementId = resource.TryGetProperty("billing_agreement_id", out var baId)
            ? baId.GetString() : null;
        if (billingAgreementId == null) return;

        var subscription = await _db.PayPalSubscriptions
            .FirstOrDefaultAsync(s => s.PayPalSubscriptionId == billingAgreementId);
        if (subscription == null) return;

        var captureId = resource.GetProperty("id").GetString()!;
        var amount = resource.TryGetProperty("amount", out var amt)
            ? decimal.TryParse(amt.GetProperty("total").GetString(), out var a) ? a : 0
            : 0;
        var currency = amt.TryGetProperty("currency", out var cur) ? cur.GetString() ?? "EUR" : "EUR";

        var existingPayment = await _db.SubscriptionPayments
            .AnyAsync(p => p.PayPalCaptureId == captureId);
        if (existingPayment) return;

        var payment = new SubscriptionPayment
        {
            UserId = subscription.UserId,
            SubscriptionId = subscription.Id,
            PayPalCaptureId = captureId,
            Amount = amount,
            Currency = currency,
            Status = PaymentStatus.Completed
        };

        _db.SubscriptionPayments.Add(payment);

        try
        {
            var details = await _paypal.GetSubscriptionDetailsAsync(billingAgreementId);

            if (details.BillingInfo?.NextBillingTime != null
                && DateTimeOffset.TryParse(details.BillingInfo.NextBillingTime, out var nextBilling))
            {
                subscription.CurrentPeriodStart = subscription.CurrentPeriodEnd ?? DateTimeOffset.UtcNow;
                subscription.CurrentPeriodEnd = nextBilling;
            }

            subscription.Status = MapPayPalStatus(details.Status);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch subscription details for {SubId} during payment completed", billingAgreementId);
        }

        subscription.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task HandlePaymentRefunded(JsonElement resource)
    {
        var saleId = resource.TryGetProperty("sale_id", out var sid) ? sid.GetString() : null;
        if (saleId == null) return;

        var payment = await _db.SubscriptionPayments
            .FirstOrDefaultAsync(p => p.PayPalCaptureId == saleId);
        if (payment == null) return;

        payment.Status = PaymentStatus.Refunded;
        await _db.SaveChangesAsync();
    }

    // ── Helpers ─────────────────────────────────────────────────

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst("userId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var id) ? id : null;
    }

    private async Task GrantPremiumRoleAsync(int userId)
    {
        var hasRole = await _db.UserRoles
            .AnyAsync(r => r.UserId == userId && r.Role == Role.Premium);

        if (!hasRole)
        {
            _db.UserRoles.Add(new UserRole
            {
                UserId = userId,
                Role = Role.Premium
            });
        }
    }

    private async Task RevokePremiumRoleAsync(int userId)
    {
        var premiumRole = await _db.UserRoles
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Role == Role.Premium);

        if (premiumRole != null)
            _db.UserRoles.Remove(premiumRole);
    }

    private static SubscriptionStatus MapPayPalStatus(string paypalStatus) => paypalStatus.ToUpperInvariant() switch
    {
        "ACTIVE" => SubscriptionStatus.Active,
        "SUSPENDED" => SubscriptionStatus.Suspended,
        "CANCELLED" => SubscriptionStatus.Cancelled,
        "EXPIRED" => SubscriptionStatus.Expired,
        _ => SubscriptionStatus.Pending
    };
}

public record ActivateSubscriptionRequest(string SubscriptionId);
public record AbandonSubscriptionRequest(string SubscriptionId);