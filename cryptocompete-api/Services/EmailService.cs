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