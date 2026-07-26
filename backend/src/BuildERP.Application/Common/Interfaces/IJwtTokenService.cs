using BuildERP.Domain.Entities;

namespace BuildERP.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    string GenerateAccessToken(ApplicationUser user, IList<string> roles, IList<string> permissions);
    RefreshToken GenerateRefreshToken(Guid userId, bool rememberMe = false);
    Task<IList<string>> GetUserPermissionsAsync(ApplicationUser user, IList<string> roles, CancellationToken ct = default);
}
