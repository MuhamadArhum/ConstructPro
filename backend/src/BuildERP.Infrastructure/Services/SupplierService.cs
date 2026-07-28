using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.AuditLogs;
using BuildERP.Application.Features.Suppliers;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BuildERP.Infrastructure.Services;

public class SupplierService : ISupplierService
{
    private readonly ApplicationDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ICurrentUserService _currentUser;

    public SupplierService(ApplicationDbContext db, IAuditLogService auditLog, ICurrentUserService currentUser)
    {
        _db = db;
        _auditLog = auditLog;
        _currentUser = currentUser;
    }

    public async Task<PaginatedList<SupplierDto>> GetAllAsync(SupplierQuery query, CancellationToken ct = default)
    {
        var q = _db.Suppliers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(x => x.Name.ToLower().Contains(s) ||
                             (x.CompanyName != null && x.CompanyName.ToLower().Contains(s)) ||
                             (x.Phone != null && x.Phone.Contains(s)));
        }
        if (query.IsActive.HasValue) q = q.Where(x => x.IsActive == query.IsActive.Value);
        q = q.OrderByDescending(x => x.CreatedAt);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<SupplierDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Suppliers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Supplier {id} not found.");
        return MapToDto(entity);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken ct = default)
    {
        var entity = new Supplier
        {
            Name = request.Name, CompanyName = request.CompanyName, Phone = request.Phone,
            Email = request.Email, Address = request.Address, NTN = request.NTN,
            Category = request.Category, TotalPurchased = request.TotalPurchased,
            TotalPaid = request.TotalPaid, IsActive = request.IsActive, Notes = request.Notes
        };
        _db.Suppliers.Add(entity);
        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Create",
            EntityType = "Supplier",
            EntityId = entity.Id.ToString(),
            NewValues = JsonSerializer.Serialize(new { entity.Name, entity.CompanyName, entity.Category }),
        }, ct);

        return MapToDto(entity);
    }

    public async Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Suppliers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Supplier {id} not found.");

        var oldValues = JsonSerializer.Serialize(new { entity.Name, entity.CompanyName, entity.Category, entity.IsActive });

        entity.Name = request.Name; entity.CompanyName = request.CompanyName; entity.Phone = request.Phone;
        entity.Email = request.Email; entity.Address = request.Address; entity.NTN = request.NTN;
        entity.Category = request.Category; entity.TotalPurchased = request.TotalPurchased;
        entity.TotalPaid = request.TotalPaid; entity.IsActive = request.IsActive; entity.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Update",
            EntityType = "Supplier",
            EntityId = id.ToString(),
            OldValues = oldValues,
            NewValues = JsonSerializer.Serialize(new { entity.Name, entity.CompanyName, entity.Category, entity.IsActive }),
        }, ct);

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Suppliers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Supplier {id} not found.");

        var oldValues = JsonSerializer.Serialize(new { entity.Name, entity.CompanyName });

        _db.Suppliers.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Delete",
            EntityType = "Supplier",
            EntityId = id.ToString(),
            OldValues = oldValues,
        }, ct);
    }

    private static SupplierDto MapToDto(Supplier s) => new()
    {
        Id = s.Id, Name = s.Name, CompanyName = s.CompanyName, Phone = s.Phone,
        Email = s.Email, Address = s.Address, NTN = s.NTN, Category = s.Category,
        TotalPurchased = s.TotalPurchased, TotalPaid = s.TotalPaid,
        OutstandingBalance = s.TotalPurchased - s.TotalPaid,
        IsActive = s.IsActive, Notes = s.Notes, CreatedAt = s.CreatedAt
    };
}
