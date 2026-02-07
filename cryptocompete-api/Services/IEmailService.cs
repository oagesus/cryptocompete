namespace CryptoCompete.Api.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string username, string verificationLink);
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
    Task SendEmailChangeEmailAsync(string toEmail, string verifyLink, string newEmail);
    Task SendReceiptEmailAsync(string toEmail, string amount, string currency, string paidDate, string subscriptionId, string captureId, string planName, string planPrice, string billingPeriod);
}