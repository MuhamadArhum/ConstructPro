using BuildERP.Application.Common.Exceptions;
using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Profile;
using BuildERP.Application.Features.Users;
using BuildERP.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace BuildERP.Infrastructure.Identity;

public class ProfileService : IProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWebRootPathProvider _webRootPathProvider;

    public ProfileService(UserManager<ApplicationUser> userManager, IWebRootPathProvider webRootPathProvider)
    {
        _userManager = userManager;
        _webRootPathProvider = webRootPathProvider;
    }

    public async Task<UserDto> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException(nameof(ApplicationUser), userId);
        return await MapToDtoAsync(user);
    }

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException(nameof(ApplicationUser), userId);

        user.FullName = request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        await _userManager.UpdateAsync(user);
        return await MapToDtoAsync(user);
    }

    public async Task<string> UploadProfilePictureAsync(Guid userId, IFormFile file, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException(nameof(ApplicationUser), userId);

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            throw new ValidationAppException(new[]
            {
                new FluentValidation.Results.ValidationFailure("File", "Only JPG, PNG, and WebP images are allowed.")
            });

        if (file.Length > 5 * 1024 * 1024)
            throw new ValidationAppException(new[]
            {
                new FluentValidation.Results.ValidationFailure("File", "File size must not exceed 5 MB.")
            });

        var uploadDir = Path.Combine(_webRootPathProvider.WebRootPath, "uploads", "profiles");
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{userId}{ext}";
        var filePath = Path.Combine(uploadDir, fileName);

        await using var stream = File.Create(filePath);
        await file.CopyToAsync(stream, ct);

        var relativePath = $"/uploads/profiles/{fileName}";
        user.ProfilePicturePath = relativePath;
        await _userManager.UpdateAsync(user);
        return relativePath;
    }

    private async Task<UserDto> MapToDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            ProfilePicturePath = user.ProfilePicturePath,
            Roles = roles,
        };
    }
}
