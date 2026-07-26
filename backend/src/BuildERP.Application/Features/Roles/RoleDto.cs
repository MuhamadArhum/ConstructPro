namespace BuildERP.Application.Features.Roles;

public class RoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsSystem { get; set; }
    public IList<PermissionDto> Permissions { get; set; } = new List<PermissionDto>();
}
