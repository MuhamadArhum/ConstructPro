using BuildERP.Application.Common.Exceptions;
using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Roles;
using BuildERP.Domain.Constants;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Identity;

public class RoleService : IRoleService
{
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly ApplicationDbContext _context;

    public RoleService(RoleManager<IdentityRole<Guid>> roleManager, ApplicationDbContext context)
    {
        _roleManager = roleManager;
        _context = context;
    }

    public async Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default)
    {
        var roles = await _roleManager.Roles.ToListAsync(ct);
        var result = new List<RoleDto>();
        foreach (var role in roles.OrderBy(r => r.Name))
            result.Add(await MapToDtoAsync(role, ct));
        return result;
    }

    public async Task<RoleDto> GetRoleByIdAsync(Guid id, CancellationToken ct = default)
    {
        var role = await _roleManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException(nameof(IdentityRole<Guid>), id);
        return await MapToDtoAsync(role, ct);
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken ct = default)
    {
        if (await _roleManager.RoleExistsAsync(request.Name))
            throw new ValidationAppException(new[]
            {
                new FluentValidation.Results.ValidationFailure(nameof(request.Name), $"Role '{request.Name}' already exists.")
            });

        var role = new IdentityRole<Guid>(request.Name);
        var result = await _roleManager.CreateAsync(role);
        if (!result.Succeeded)
            throw new ValidationAppException(result.Errors.Select(e =>
                new FluentValidation.Results.ValidationFailure("Role", e.Description)));

        if (request.PermissionIds.Count > 0)
            await AssignPermissionsAsync(role.Id, new AssignPermissionsRequest { PermissionIds = request.PermissionIds }, ct);

        return await MapToDtoAsync(role, ct);
    }

    public async Task DeleteRoleAsync(Guid id, CancellationToken ct = default)
    {
        var role = await _roleManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException(nameof(IdentityRole<Guid>), id);

        if (Roles.All.Contains(role.Name))
            throw new ValidationAppException(new[]
            {
                new FluentValidation.Results.ValidationFailure("Role", "System roles cannot be deleted.")
            });

        await _roleManager.DeleteAsync(role);
    }

    public async Task<IReadOnlyList<PermissionDto>> GetPermissionsAsync(CancellationToken ct = default)
    {
        return await _context.Permissions
            .OrderBy(p => p.Module).ThenBy(p => p.Action)
            .Select(p => new PermissionDto
            {
                Id = p.Id,
                Module = p.Module,
                Action = p.Action,
                Code = p.Code,
                Description = p.Description,
            })
            .ToListAsync(ct);
    }

    public async Task AssignPermissionsAsync(Guid roleId, AssignPermissionsRequest request, CancellationToken ct = default)
    {
        _ = await _roleManager.FindByIdAsync(roleId.ToString())
            ?? throw new NotFoundException(nameof(IdentityRole<Guid>), roleId);

        var existing = await _context.RolePermissions.Where(rp => rp.RoleId == roleId).ToListAsync(ct);
        _context.RolePermissions.RemoveRange(existing);

        foreach (var permId in request.PermissionIds.Distinct())
            _context.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permId });

        await _context.SaveChangesAsync(ct);
    }

    private async Task<RoleDto> MapToDtoAsync(IdentityRole<Guid> role, CancellationToken ct)
    {
        var perms = await _context.RolePermissions
            .Where(rp => rp.RoleId == role.Id)
            .Include(rp => rp.Permission)
            .Select(rp => new PermissionDto
            {
                Id = rp.Permission!.Id,
                Module = rp.Permission.Module,
                Action = rp.Permission.Action,
                Code = rp.Permission.Code,
                Description = rp.Permission.Description,
            })
            .ToListAsync(ct);

        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name ?? string.Empty,
            IsSystem = Roles.All.Contains(role.Name),
            Permissions = perms,
        };
    }
}
