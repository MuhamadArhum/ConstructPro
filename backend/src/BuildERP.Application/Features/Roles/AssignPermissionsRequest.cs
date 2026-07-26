namespace BuildERP.Application.Features.Roles;

public class AssignPermissionsRequest
{
    public IList<Guid> PermissionIds { get; set; } = new List<Guid>();
}
