using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Notifications;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    public NotificationService(ApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<NotificationDto>> GetAllAsync(NotificationQuery query, string userId, CancellationToken ct = default)
    {
        var q = _db.Notifications.Where(n => n.UserId == null || n.UserId == userId).AsQueryable();
        if (query.IsRead.HasValue) q = q.Where(n => n.IsRead == query.IsRead.Value);
        q = q.OrderByDescending(n => n.CreatedAt);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<NotificationDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync(string userId, CancellationToken ct = default)
    {
        var count = await _db.Notifications
            .CountAsync(n => !n.IsRead && (n.UserId == null || n.UserId == userId), ct);
        return new UnreadCountDto { Count = count };
    }

    public async Task MarkAsReadAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Notifications.FindAsync(new object[] { id }, ct);
        if (entity != null) { entity.IsRead = true; entity.ReadAt = DateTime.UtcNow; await _db.SaveChangesAsync(ct); }
    }

    public async Task MarkAllAsReadAsync(string userId, CancellationToken ct = default)
    {
        var notifications = await _db.Notifications
            .Where(n => !n.IsRead && (n.UserId == null || n.UserId == userId)).ToListAsync(ct);
        foreach (var n in notifications) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; }
        await _db.SaveChangesAsync(ct);
    }

    public async Task GenerateSystemNotificationsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var upcoming = now.AddDays(7);

        // Low stock alerts
        var lowStockItems = await _db.InventoryItems
            .Where(i => i.CurrentStock <= i.LowStockThreshold).ToListAsync(ct);
        foreach (var item in lowStockItems)
        {
            var exists = await _db.Notifications.AnyAsync(
                n => n.Type == NotificationType.LowStock && n.EntityId == item.Id.ToString() && !n.IsRead, ct);
            if (!exists)
            {
                _db.Notifications.Add(new Notification
                {
                    Type = NotificationType.LowStock,
                    Title = "Low Stock Alert",
                    Message = $"{item.Name} is running low (Current: {item.CurrentStock} {item.Unit})",
                    EntityId = item.Id.ToString()
                });
            }
        }

        // Tax due alerts
        var dueTaxes = await _db.TaxRecords
            .Where(t => !t.IsPaid && t.DueDate.HasValue && t.DueDate.Value <= upcoming).ToListAsync(ct);
        foreach (var tax in dueTaxes)
        {
            var exists = await _db.Notifications.AnyAsync(
                n => n.Type == NotificationType.TaxDue && n.EntityId == tax.Id.ToString() && !n.IsRead, ct);
            if (!exists)
            {
                _db.Notifications.Add(new Notification
                {
                    Type = NotificationType.TaxDue,
                    Title = "Tax Payment Due",
                    Message = $"{tax.TaxType} of PKR {tax.Amount:N0} is due on {tax.DueDate:dd-MMM-yyyy}",
                    EntityId = tax.Id.ToString()
                });
            }
        }

        // Vehicle maintenance due alerts
        var dueMaintenance = await _db.Vehicles
            .Where(v => v.NextMaintenanceDate.HasValue && v.NextMaintenanceDate.Value <= upcoming).ToListAsync(ct);
        foreach (var vehicle in dueMaintenance)
        {
            var exists = await _db.Notifications.AnyAsync(
                n => n.Type == NotificationType.MaintenanceDue && n.EntityId == vehicle.Id.ToString() && !n.IsRead, ct);
            if (!exists)
            {
                _db.Notifications.Add(new Notification
                {
                    Type = NotificationType.MaintenanceDue,
                    Title = "Vehicle Maintenance Due",
                    Message = $"Vehicle {vehicle.RegistrationNumber} is due for maintenance on {vehicle.NextMaintenanceDate:dd-MMM-yyyy}",
                    EntityId = vehicle.Id.ToString()
                });
            }
        }

        await _db.SaveChangesAsync(ct);
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id, Type = n.Type, TypeDisplay = n.Type.ToString(),
        Title = n.Title, Message = n.Message, IsRead = n.IsRead,
        EntityId = n.EntityId, CreatedAt = n.CreatedAt, ReadAt = n.ReadAt
    };
}
