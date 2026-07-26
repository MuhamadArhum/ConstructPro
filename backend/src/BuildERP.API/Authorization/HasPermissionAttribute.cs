using Microsoft.AspNetCore.Authorization;

namespace BuildERP.API.Authorization;

public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission) : base(policy: permission) { }
}
