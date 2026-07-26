namespace BuildERP.Application.Features.Auth;

public class ForgotPasswordResponse
{
    public string Message { get; set; } = string.Empty;
    /// <summary>Only populated in Development for testing without a real email server.</summary>
    public string? DevResetUrl { get; set; }
}
