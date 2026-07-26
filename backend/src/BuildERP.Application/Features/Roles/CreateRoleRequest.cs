namespace BuildERP.Application.Features.Roles;

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public IList<Guid> PermissionIds { get; set; } = new List<Guid>();
}
