using System.Reflection;
using Resend;

namespace CryptoCompete.Api.Services;

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly string _fromEmail;

    public EmailService(IResend resend, IConfiguration configuration)
    {
        _resend = resend;
        _fromEmail = configuration["Resend:FromEmail"] ?? throw new InvalidOperationException("Resend:FromEmail not configured");
    }

    public async Task SendVerificationEmailAsync(string toEmail, string username, string verificationLink)
    {
        var template = await LoadTemplateAsync("VerificationEmail.html");
        
        var htmlContent = template
            .Replace("{{USERNAME}}", username)
            .Replace("{{VERIFICATION_LINK}}", verificationLink);

        var message = new EmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = "Verify your CryptoCompete account",
            HtmlBody = htmlContent
        };

        await _resend.EmailSendAsync(message);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
        var template = await LoadTemplateAsync("PasswordResetEmail.html");
        
        var htmlContent = template
            .Replace("{{RESET_LINK}}", resetLink);

        var message = new EmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = "Reset your CryptoCompete password",
            HtmlBody = htmlContent
        };

        await _resend.EmailSendAsync(message);
    }

    public async Task SendEmailChangeEmailAsync(string toEmail, string verifyLink, string newEmail)
    {
        var template = await LoadTemplateAsync("EmailChangeEmail.html");
        
        var htmlContent = template
            .Replace("{{VERIFY_LINK}}", verifyLink)
            .Replace("{{NEW_EMAIL}}", newEmail);

        var message = new EmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = "Verify your new email address",
            HtmlBody = htmlContent
        };

        await _resend.EmailSendAsync(message);
    }

    public async Task SendReceiptEmailAsync(string toEmail, string amount, string currency, string paidDate, string subscriptionId, string captureId, string planName, string planPrice, string billingPeriod)
    {
        var template = await LoadTemplateAsync("ReceiptEmail.html");

        var htmlContent = template
            .Replace("{{AMOUNT}}", amount)
            .Replace("{{CURRENCY}}", currency)
            .Replace("{{PAID_DATE}}", paidDate)
            .Replace("{{SUBSCRIPTION_ID}}", subscriptionId)
            .Replace("{{CAPTURE_ID}}", captureId)
            .Replace("{{PLAN_NAME}}", planName)
            .Replace("{{PLAN_PRICE}}", planPrice)
            .Replace("{{BILLING_PERIOD}}", billingPeriod);

        var message = new EmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = $"Your receipt from CryptoCompete #{captureId}",
            HtmlBody = htmlContent
        };

        await _resend.EmailSendAsync(message);
    }

    public async Task SendPriceAlarmEmailAsync(string toEmail, string cryptocurrencyName, string symbol, string targetPrice, string currentPrice, string currency, bool isAbove, string triggeredAt, string checkPricesLink)
    {
        var template = await LoadTemplateAsync("PriceAlarmEmail.html");

        var direction = isAbove ? "risen above" : "dropped below";

        var htmlContent = template
            .Replace("{{CRYPTOCURRENCY_NAME}}", cryptocurrencyName)
            .Replace("{{SYMBOL}}", symbol)
            .Replace("{{TARGET_PRICE}}", targetPrice)
            .Replace("{{CURRENT_PRICE}}", currentPrice)
            .Replace("{{CURRENCY}}", currency)
            .Replace("risen above", direction)
            .Replace("{{TRIGGERED_AT}}", triggeredAt)
            .Replace("{{CHECK_PRICES_LINK}}", checkPricesLink);

        var message = new EmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = $"{cryptocurrencyName} has {direction} {currency}{targetPrice}",
            HtmlBody = htmlContent
        };

        await _resend.EmailSendAsync(message);
    }

    private static async Task<string> LoadTemplateAsync(string templateName)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = $"cryptocompete_api.Templates.Emails.{templateName}";

        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new FileNotFoundException($"Email template '{templateName}' not found");
        
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync();
    }
}