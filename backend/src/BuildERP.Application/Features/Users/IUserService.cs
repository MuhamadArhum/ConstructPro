using BuildERP.Application.Common.Models;

namespace BuildERP.Application.Features.Users;

public interface IUserService
{
    Task<PaginatedList<UserDto>> GetUsersAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<UserDto> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task DeactivateUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task AdminResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default);
}
