using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Profile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly ICurrentUserService _currentUserService;

    public ProfileController(IProfileService profileService, ICurrentUserService currentUserService)
    {
        _profileService = profileService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        if (_currentUserService.UserId is not Guid userId) return Unauthorized();
        var profile = await _profileService.GetProfileAsync(userId, ct);
        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        if (_currentUserService.UserId is not Guid userId) return Unauthorized();
        var profile = await _profileService.UpdateProfileAsync(userId, request, ct);
        return Ok(profile);
    }

    [HttpPut("picture")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadPicture(IFormFile file, CancellationToken ct)
    {
        if (_currentUserService.UserId is not Guid userId) return Unauthorized();
        var path = await _profileService.UploadProfilePictureAsync(userId, file, ct);
        return Ok(new { path });
    }
}
