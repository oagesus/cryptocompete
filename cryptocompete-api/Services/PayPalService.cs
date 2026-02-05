using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CryptoCompete.Api.Services;

public class PayPalService : IPayPalService
{
    private readonly HttpClient _httpClient;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _baseUrl;
    private readonly string _webhookId;
    private string? _cachedToken;
    private DateTimeOffset _tokenExpiry = DateTimeOffset.MinValue;

    public PayPalService(IConfiguration configuration, HttpClient httpClient)
    {
        _httpClient = httpClient;
        _clientId = configuration["PayPal:ClientId"]
            ?? throw new InvalidOperationException("PayPal:ClientId is not configured");
        _clientSecret = configuration["PayPal:ClientSecret"]
            ?? throw new InvalidOperationException("PayPal:ClientSecret is not configured");
        _webhookId = configuration["PayPal:WebhookId"] ?? string.Empty;

        var useSandbox = configuration.GetValue("PayPal:UseSandbox", true);
        _baseUrl = useSandbox
            ? "https://api-m.sandbox.paypal.com"
            : "https://api-m.paypal.com";
    }

    public async Task<string> GetAccessTokenAsync()
    {
        if (_cachedToken != null && DateTimeOffset.UtcNow < _tokenExpiry)
            return _cachedToken;

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_clientId}:{_clientSecret}"));

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v1/oauth2/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        request.Content = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("grant_type", "client_credentials") });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        _cachedToken = json.GetProperty("access_token").GetString()!;
        var expiresIn = json.GetProperty("expires_in").GetInt32();
        _tokenExpiry = DateTimeOffset.UtcNow.AddSeconds(expiresIn - 60);

        return _cachedToken;
    }

    public async Task<PayPalCreateSubscriptionResponse> CreateSubscriptionAsync(
        string planId, string returnUrl, string cancelUrl)
    {
        var token = await GetAccessTokenAsync();

        var body = new Dictionary<string, object>
        {
            ["plan_id"] = planId,
            ["application_context"] = new Dictionary<string, object>
            {
                ["return_url"] = returnUrl,
                ["cancel_url"] = cancelUrl,
                ["user_action"] = "SUBSCRIBE_NOW",
                ["brand_name"] = "CryptoCompete"
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v1/billing/subscriptions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<PayPalCreateSubscriptionResponse>())!;
    }

    public async Task<PayPalSubscriptionDetails> GetSubscriptionDetailsAsync(string subscriptionId)
    {
        var token = await GetAccessTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/v1/billing/subscriptions/{subscriptionId}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<PayPalSubscriptionDetails>())!;
    }

    public async Task CancelSubscriptionAsync(string subscriptionId, string reason)
    {
        var token = await GetAccessTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v1/billing/subscriptions/{subscriptionId}/cancel");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { reason }),
            Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    public async Task SuspendSubscriptionAsync(string subscriptionId, string reason)
    {
        var token = await GetAccessTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v1/billing/subscriptions/{subscriptionId}/suspend");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { reason }),
            Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    public async Task ActivateSubscriptionAsync(string subscriptionId, string reason)
    {
        var token = await GetAccessTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v1/billing/subscriptions/{subscriptionId}/activate");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { reason }),
            Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    public async Task<PayPalPlanDetails> GetPlanDetailsAsync(string planId)
    {
        var token = await GetAccessTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/v1/billing/plans/{planId}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<PayPalPlanDetails>())!;
    }

    public async Task<bool> VerifyWebhookSignatureAsync(IHeaderDictionary headers, string body)
    {
        if (string.IsNullOrEmpty(_webhookId)) return false;

        var token = await GetAccessTokenAsync();

        var verificationBody = new
        {
            auth_algo = headers["paypal-auth-algo"].ToString(),
            cert_url = headers["paypal-cert-url"].ToString(),
            transmission_id = headers["paypal-transmission-id"].ToString(),
            transmission_sig = headers["paypal-transmission-sig"].ToString(),
            transmission_time = headers["paypal-transmission-time"].ToString(),
            webhook_id = _webhookId,
            webhook_event = JsonSerializer.Deserialize<JsonElement>(body)
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v1/notifications/verify-webhook-signature");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(JsonSerializer.Serialize(verificationBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode) return false;

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.TryGetProperty("verification_status", out var status)
            && status.GetString() == "SUCCESS";
    }
}

// ── Response DTOs ──────────────────────────────────────────────

public class PayPalCreateSubscriptionResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("links")]
    public List<PayPalLink> Links { get; set; } = [];

    public string? ApproveUrl => Links.FirstOrDefault(l => l.Rel == "approve")?.Href;
}

public class PayPalSubscriptionDetails
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("plan_id")]
    public string PlanId { get; set; } = string.Empty;

    [JsonPropertyName("subscriber")]
    public PayPalSubscriber? Subscriber { get; set; }

    [JsonPropertyName("billing_info")]
    public PayPalBillingInfo? BillingInfo { get; set; }

    [JsonPropertyName("start_time")]
    public string? StartTime { get; set; }

    [JsonPropertyName("create_time")]
    public string? CreateTime { get; set; }
}

public class PayPalSubscriber
{
    [JsonPropertyName("email_address")]
    public string? EmailAddress { get; set; }

    [JsonPropertyName("payer_id")]
    public string? PayerId { get; set; }
}

public class PayPalBillingInfo
{
    [JsonPropertyName("next_billing_time")]
    public string? NextBillingTime { get; set; }

    [JsonPropertyName("cycle_executions")]
    public List<PayPalCycleExecution>? CycleExecutions { get; set; }
}

public class PayPalCycleExecution
{
    [JsonPropertyName("tenure_type")]
    public string TenureType { get; set; } = string.Empty;

    [JsonPropertyName("cycles_completed")]
    public int CyclesCompleted { get; set; }

    [JsonPropertyName("cycles_remaining")]
    public int? CyclesRemaining { get; set; }
}

public class PayPalPlanDetails
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("billing_cycles")]
    public List<PayPalBillingCycle>? BillingCycles { get; set; }

    public (decimal amount, string currency) GetRegularPrice()
    {
        var regular = BillingCycles?.FirstOrDefault(c => c.TenureType == "REGULAR");
        if (regular?.PricingScheme?.FixedPrice != null)
        {
            decimal.TryParse(regular.PricingScheme.FixedPrice.Value, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var amount);
            return (amount, regular.PricingScheme.FixedPrice.CurrencyCode ?? "EUR");
        }
        return (0, "EUR");
    }
}

public class PayPalBillingCycle
{
    [JsonPropertyName("tenure_type")]
    public string TenureType { get; set; } = string.Empty;

    [JsonPropertyName("sequence")]
    public int Sequence { get; set; }

    [JsonPropertyName("pricing_scheme")]
    public PayPalPricingScheme? PricingScheme { get; set; }

    [JsonPropertyName("frequency")]
    public PayPalFrequency? Frequency { get; set; }
}

public class PayPalPricingScheme
{
    [JsonPropertyName("fixed_price")]
    public PayPalMoney? FixedPrice { get; set; }
}

public class PayPalMoney
{
    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;

    [JsonPropertyName("currency_code")]
    public string? CurrencyCode { get; set; }
}

public class PayPalFrequency
{
    [JsonPropertyName("interval_unit")]
    public string IntervalUnit { get; set; } = string.Empty;

    [JsonPropertyName("interval_count")]
    public int IntervalCount { get; set; }
}

public class PayPalLink
{
    [JsonPropertyName("href")]
    public string Href { get; set; } = string.Empty;

    [JsonPropertyName("rel")]
    public string Rel { get; set; } = string.Empty;

    [JsonPropertyName("method")]
    public string? Method { get; set; }
}