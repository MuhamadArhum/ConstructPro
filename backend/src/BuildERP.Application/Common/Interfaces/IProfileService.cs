using BuildERP.Application.Features.Profile;
using BuildERP.Application.Features.Users;
using Microsoft.AspNetCore.Http;

namespace BuildERP.Application.Common.Interfaces;

public interface IProfileService
{
    Task<UserDto> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<string> UploadProfilePictureAsync(Guid userId, IFormFile file, CancellationToken ct = default);
}
