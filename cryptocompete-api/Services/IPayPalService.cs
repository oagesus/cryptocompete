namespace CryptoCompete.Api.Services;

public interface IPayPalService
{
    Task<string> GetAccessTokenAsync();
    Task<PayPalCreateSubscriptionResponse> CreateSubscriptionAsync(string planId, string returnUrl, string cancelUrl);
    Task<PayPalSubscriptionDetails> GetSubscriptionDetailsAsync(string subscriptionId);
    Task CancelSubscriptionAsync(string subscriptionId, string reason);
    Task SuspendSubscriptionAsync(string subscriptionId, string reason);
    Task ActivateSubscriptionAsync(string subscriptionId, string reason);
    Task<PayPalPlanDetails> GetPlanDetailsAsync(string planId);
    Task<bool> VerifyWebhookSignatureAsync(IHeaderDictionary headers, string body);
}