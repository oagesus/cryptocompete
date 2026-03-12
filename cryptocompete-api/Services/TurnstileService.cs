using System.Text.Json.Serialization;

namespace CryptoCompete.Api.Services;

public class TurnstileService : ITurnstileService
{
    private readonly HttpClient _httpClient;
    private readonly string _secretKey;

    public TurnstileService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _secretKey = configuration["Turnstile:SecretKey"]
            ?? throw new InvalidOperationException("Turnstile:SecretKey is not configured");
    }

    public async Task<bool> ValidateTokenAsync(string token)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            { "secret", _secretKey },
            { "response", token }
        });

        var response = await _httpClient.PostAsync(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify", content);

        var json = await response.Content.ReadFromJsonAsync<TurnstileResponse>();

        return json?.Success == true;
    }

    private class TurnstileResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
    }
}
