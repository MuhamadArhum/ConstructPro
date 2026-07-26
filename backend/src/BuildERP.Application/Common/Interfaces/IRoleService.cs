using BuildERP.Application.Features.Roles;

namespace BuildERP.Application.Common.Interfaces;

public interface IRoleService
{
    Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default);
    Task<RoleDto> GetRoleByIdAsync(Guid id, CancellationToken ct = default);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken ct = default);
    Task DeleteRoleAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PermissionDto>> GetPermissionsAsync(CancellationToken ct = default);
    Task AssignPermissionsAsync(Guid roleId, AssignPermissionsRequest request, CancellationToken ct = default);
}
