using BuildERP.API.Authorization;
using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Roles;
using BuildERP.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [HasPermission(Permissions.RolesView)]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
    {
        var roles = await _roleService.GetRolesAsync(ct);
        return Ok(roles);
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.RolesView)]
    public async Task<IActionResult> GetRole(Guid id, CancellationToken ct)
    {
        var role = await _roleService.GetRoleByIdAsync(id, ct);
        return Ok(role);
    }

    [HttpPost]
    [HasPermission(Permissions.RolesCreate)]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request, CancellationToken ct)
    {
        var role = await _roleService.CreateRoleAsync(request, ct);
        return CreatedAtAction(nameof(GetRole), new { id = role.Id }, role);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.RolesDelete)]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken ct)
    {
        await _roleService.DeleteRoleAsync(id, ct);
        return NoContent();
    }

    [HttpGet("permissions")]
    [HasPermission(Permissions.RolesView)]
    public async Task<IActionResult> GetPermissions(CancellationToken ct)
    {
        var perms = await _roleService.GetPermissionsAsync(ct);
        return Ok(perms);
    }

    [HttpPut("{id:guid}/permissions")]
    [HasPermission(Permissions.RolesEdit)]
    public async Task<IActionResult> AssignPermissions(Guid id, [FromBody] AssignPermissionsRequest request, CancellationToken ct)
    {
        await _roleService.AssignPermissionsAsync(id, request, ct);
        return NoContent();
    }
}
