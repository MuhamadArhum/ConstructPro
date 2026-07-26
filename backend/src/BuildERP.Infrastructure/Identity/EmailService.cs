using BuildERP.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace BuildERP.Infrastructure.Identity;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl, CancellationToken ct = default)
    {
        // Replace with real SMTP / SendGrid integration in production.
        _logger.LogWarning(
            "Password reset for {Email} ({Name}). Reset URL: {Url}",
            toEmail, toName, resetUrl);

        return Task.CompletedTask;
    }
}
