namespace CryptoCompete.Api.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string username, string verificationLink);
    Task SendPasswordResetEmailAsync(string toEmail, string username, string resetLink);
    Task SendEmailChangeEmailAsync(string toEmail, string username, string verifyLink, string newEmail);
}