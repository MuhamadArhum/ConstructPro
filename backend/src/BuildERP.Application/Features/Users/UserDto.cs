namespace BuildERP.Application.Features.Users;

public class UserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? ProfilePicturePath { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
}
