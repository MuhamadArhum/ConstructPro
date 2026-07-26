namespace BuildERP.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl, CancellationToken ct = default);
}
