namespace BuildERP.Application.Features.Users;

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}
