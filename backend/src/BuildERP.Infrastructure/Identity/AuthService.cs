using System.Security.Cryptography;
using BuildERP.Application.Common.Exceptions;
using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.AuditLogs;
using BuildERP.Application.Features.Auth;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildERP.Infrastructure.Identity;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly JwtSettings _jwtSettings;
    private readonly IEmailService _emailService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IOptions<JwtSettings> jwtSettings,
        IEmailService emailService,
        IAuditLogService auditLogService,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _context = context;
        _jwtTokenService = jwtTokenService;
        _jwtSettings = jwtSettings.Value;
        _emailService = emailService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is null || !user.IsActive)
        {
            await _auditLogService.LogAsync(new AuditLogEntry
            {
                UserEmail = request.Email,
                Action = "Login",
                EntityType = "User",
                Succeeded = false,
                ErrorMessage = "User not found or inactive",
            }, ct);
            throw new AuthenticationException("Invalid email or password.");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            await _auditLogService.LogAsync(new AuditLogEntry
            {
                UserId = user.Id,
                UserEmail = user.Email ?? string.Empty,
                Action = "Login",
                EntityType = "User",
                EntityId = user.Id.ToString(),
                Succeeded = false,
                ErrorMessage = "Invalid password",
            }, ct);
            throw new AuthenticationException("Invalid email or password.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var response = await IssueTokensAsync(user, roles, request.RememberMe, ct);

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            UserId = user.Id,
            UserEmail = user.Email ?? string.Empty,
            Action = "Login",
            EntityType = "User",
            EntityId = user.Id.ToString(),
            Succeeded = true,
        }, ct);

        return response;
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, ct);

        if (storedToken is null || !storedToken.IsActive || storedToken.User is null)
            throw new AuthenticationException("Invalid or expired refresh token.");

        storedToken.RevokedAt = DateTime.UtcNow;

        var roles = await _userManager.GetRolesAsync(storedToken.User);
        var isLongLived = storedToken.ExpiresAt > DateTime.UtcNow.AddDays(7);
        var response = await IssueTokensAsync(storedToken.User, roles, isLongLived, ct);

        storedToken.ReplacedByToken = response.RefreshToken;
        await _context.SaveChangesAsync(ct);

        return response;
    }

    public async Task LogoutAsync(Guid userId, string refreshToken, CancellationToken ct = default)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.UserId == userId, ct);

        if (storedToken is not null && storedToken.IsActive)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            UserId = userId,
            UserEmail = user?.Email ?? string.Empty,
            Action = "Logout",
            EntityType = "User",
            EntityId = userId.ToString(),
        }, ct);
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request, string frontendBaseUrl, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user is null || !user.IsActive)
            return new ForgotPasswordResponse { Message = "If that email is registered, you will receive a reset link shortly." };

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _userManager.UpdateAsync(user);

        var encodedToken = Uri.EscapeDataString(token);
        var encodedEmail = Uri.EscapeDataString(user.Email ?? string.Empty);
        var resetUrl = $"{frontendBaseUrl}/reset-password?email={encodedEmail}&token={encodedToken}";

        await _emailService.SendPasswordResetEmailAsync(user.Email!, user.FullName, resetUrl, ct);

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            UserId = user.Id,
            UserEmail = user.Email ?? string.Empty,
            Action = "ForgotPassword",
            EntityType = "User",
            EntityId = user.Id.ToString(),
        }, ct);

        return new ForgotPasswordResponse
        {
            Message = "If that email is registered, you will receive a reset link shortly.",
            DevResetUrl = resetUrl,
        };
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new AuthenticationException("Invalid or expired reset token.");

        if (user.PasswordResetToken != request.Token || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            throw new AuthenticationException("Invalid or expired reset token.");

        var removeResult = await _userManager.RemovePasswordAsync(user);
        if (!removeResult.Succeeded)
            throw new ValidationAppException(removeResult.Errors.Select(e =>
                new FluentValidation.Results.ValidationFailure("Password", e.Description)));

        var addResult = await _userManager.AddPasswordAsync(user, request.NewPassword);
        if (!addResult.Succeeded)
            throw new ValidationAppException(addResult.Errors.Select(e =>
                new FluentValidation.Results.ValidationFailure("NewPassword", e.Description)));

        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _userManager.UpdateAsync(user);

        var tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(ct);
        tokens.ForEach(t => t.RevokedAt = DateTime.UtcNow);
        await _context.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            UserId = user.Id,
            UserEmail = user.Email ?? string.Empty,
            Action = "ResetPassword",
            EntityType = "User",
            EntityId = user.Id.ToString(),
        }, ct);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException(nameof(ApplicationUser), userId);

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            throw new ValidationAppException(result.Errors.Select(e =>
                new FluentValidation.Results.ValidationFailure("Password", e.Description)));

        await _auditLogService.LogAsync(new AuditLogEntry
        {
            UserId = user.Id,
            UserEmail = user.Email ?? string.Empty,
            Action = "ChangePassword",
            EntityType = "User",
            EntityId = user.Id.ToString(),
        }, ct);
    }

    private async Task<LoginResponse> IssueTokensAsync(ApplicationUser user, IList<string> roles, bool rememberMe, CancellationToken ct)
    {
        var permissions = await _jwtTokenService.GetUserPermissionsAsync(user, roles, ct);
        var accessToken = _jwtTokenService.GenerateAccessToken(user, roles, permissions);
        var refreshToken = _jwtTokenService.GenerateRefreshToken(user.Id, rememberMe);

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(ct);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            ProfilePicturePath = user.ProfilePicturePath,
            Roles = roles,
            Permissions = permissions,
        };
    }
}
