using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Notifications;
namespace BuildERP.Application.Common.Interfaces;
public interface INotificationService
{
    Task<PaginatedList<NotificationDto>> GetAllAsync(NotificationQuery query, string userId, CancellationToken ct = default);
    Task<UnreadCountDto> GetUnreadCountAsync(string userId, CancellationToken ct = default);
    Task MarkAsReadAsync(Guid id, CancellationToken ct = default);
    Task MarkAllAsReadAsync(string userId, CancellationToken ct = default);
    Task GenerateSystemNotificationsAsync(CancellationToken ct = default);
}
