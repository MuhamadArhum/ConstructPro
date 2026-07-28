using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.AuditLogs;
using BuildERP.Application.Features.Machinery;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace BuildERP.Infrastructure.Services;

public class MachineryService : IMachineryService
{
    private readonly ApplicationDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ICurrentUserService _currentUser;

    public MachineryService(ApplicationDbContext db, IAuditLogService auditLog, ICurrentUserService currentUser)
    {
        _db = db;
        _auditLog = auditLog;
        _currentUser = currentUser;
    }

    public async Task<PaginatedList<MachineryDto>> GetAllAsync(int page, int pageSize, string? search, string? status, CancellationToken ct = default)
    {
        var q = _db.Machineries.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            q = q.Where(m =>
                m.Name.ToLower().Contains(s) ||
                (m.Model != null && m.Model.ToLower().Contains(s)) ||
                (m.SerialNumber != null && m.SerialNumber.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<MachineryStatus>(status, out var parsedStatus))
            q = q.Where(m => m.Status == parsedStatus);

        q = q.OrderBy(m => m.Name);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PaginatedList<MachineryDto>(items.Select(MapToDto).ToList(), totalCount, page, pageSize);
    }

    public async Task<MachineryDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Machineries.Include(m => m.MaintenanceRecords)
            .FirstOrDefaultAsync(m => m.Id == id, ct)
            ?? throw new KeyNotFoundException($"Machinery {id} not found.");
        return MapToDto(entity);
    }

    public async Task<MachineryDto> CreateAsync(CreateMachineryRequest request, CancellationToken ct = default)
    {
        var entity = new Machinery
        {
            Name = request.Name, Model = request.Model, SerialNumber = request.SerialNumber,
            PurchaseDate = request.PurchaseDate, PurchasePrice = request.PurchasePrice,
            TotalRunningHours = request.TotalRunningHours, NextMaintenanceDate = request.NextMaintenanceDate,
            Notes = request.Notes, Status = MachineryStatus.Active, CreatedAt = DateTime.UtcNow
        };

        _db.Machineries.Add(entity);
        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Create",
            EntityType = "Machinery",
            EntityId = entity.Id.ToString(),
            NewValues = JsonSerializer.Serialize(new { entity.Name, entity.Model, entity.Status }),
        }, ct);

        return MapToDto(entity);
    }

    public async Task<MachineryDto> UpdateAsync(Guid id, UpdateMachineryRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Machineries.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Machinery {id} not found.");

        var oldValues = JsonSerializer.Serialize(new { entity.Name, entity.Model, entity.Status });

        entity.Name = request.Name; entity.Model = request.Model; entity.SerialNumber = request.SerialNumber;
        entity.PurchaseDate = request.PurchaseDate; entity.PurchasePrice = request.PurchasePrice;
        entity.Status = request.Status; entity.TotalRunningHours = request.TotalRunningHours;
        entity.NextMaintenanceDate = request.NextMaintenanceDate; entity.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Update",
            EntityType = "Machinery",
            EntityId = id.ToString(),
            OldValues = oldValues,
            NewValues = JsonSerializer.Serialize(new { entity.Name, entity.Model, entity.Status }),
        }, ct);

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Machineries.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Machinery {id} not found.");

        var oldValues = JsonSerializer.Serialize(new { entity.Name, entity.Model });

        _db.Machineries.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Delete",
            EntityType = "Machinery",
            EntityId = id.ToString(),
            OldValues = oldValues,
        }, ct);
    }

    public async Task<MachineryMaintenanceDto> AddMaintenanceAsync(Guid machineryId, AddMaintenanceRequest request, CancellationToken ct = default)
    {
        var machinery = await _db.Machineries.FindAsync(new object[] { machineryId }, ct)
            ?? throw new KeyNotFoundException($"Machinery {machineryId} not found.");

        var record = new MachineryMaintenance
        {
            MachineryId = machineryId, MaintenanceDate = request.MaintenanceDate,
            Type = request.Type, Description = request.Description, Cost = request.Cost,
            RunningHoursAtService = request.RunningHoursAtService, NextMaintenanceDate = request.NextMaintenanceDate,
            ServiceProvider = request.ServiceProvider, CreatedAt = DateTime.UtcNow
        };

        if (request.NextMaintenanceDate.HasValue)
            machinery.NextMaintenanceDate = request.NextMaintenanceDate;

        _db.MachineryMaintenances.Add(record);
        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "AddMaintenance",
            EntityType = "Machinery",
            EntityId = machineryId.ToString(),
            NewValues = JsonSerializer.Serialize(new { machinery.Name, record.Type, record.Cost, record.MaintenanceDate }),
        }, ct);

        return MapMaintenanceDto(record, machinery.Name);
    }

    public async Task<List<MachineryMaintenanceDto>> GetMaintenanceHistoryAsync(Guid machineryId, CancellationToken ct = default)
    {
        var machinery = await _db.Machineries.FindAsync(new object[] { machineryId }, ct)
            ?? throw new KeyNotFoundException($"Machinery {machineryId} not found.");

        var records = await _db.MachineryMaintenances
            .Where(r => r.MachineryId == machineryId)
            .OrderByDescending(r => r.MaintenanceDate)
            .ToListAsync(ct);

        return records.Select(r => MapMaintenanceDto(r, machinery.Name)).ToList();
    }

    public async Task<List<MachineryDto>> GetDueForMaintenanceAsync(CancellationToken ct = default)
    {
        var threshold = DateTime.UtcNow.AddDays(7);
        var items = await _db.Machineries
            .Where(m => m.Status == MachineryStatus.Active &&
                        m.NextMaintenanceDate.HasValue && m.NextMaintenanceDate <= threshold)
            .OrderBy(m => m.NextMaintenanceDate)
            .ToListAsync(ct);

        return items.Select(MapToDto).ToList();
    }

    private static MachineryDto MapToDto(Machinery m) => new()
    {
        Id = m.Id, Name = m.Name, Model = m.Model, SerialNumber = m.SerialNumber,
        PurchaseDate = m.PurchaseDate, PurchasePrice = m.PurchasePrice, Status = m.Status,
        StatusDisplay = AddSpacesToPascalCase(m.Status.ToString()), TotalRunningHours = m.TotalRunningHours,
        NextMaintenanceDate = m.NextMaintenanceDate,
        IsMaintenanceDue = m.NextMaintenanceDate.HasValue && m.NextMaintenanceDate <= DateTime.UtcNow.AddDays(7),
        Notes = m.Notes, CreatedAt = m.CreatedAt
    };

    private static MachineryMaintenanceDto MapMaintenanceDto(MachineryMaintenance r, string machineryName) => new()
    {
        Id = r.Id, MachineryId = r.MachineryId, MachineryName = machineryName,
        MaintenanceDate = r.MaintenanceDate, Type = r.Type, TypeDisplay = r.Type.ToString(),
        Description = r.Description, Cost = r.Cost, RunningHoursAtService = r.RunningHoursAtService,
        NextMaintenanceDate = r.NextMaintenanceDate, ServiceProvider = r.ServiceProvider, CreatedAt = r.CreatedAt
    };

    private static string AddSpacesToPascalCase(string text)
        => Regex.Replace(text, "([A-Z])", " $1").Trim();
}
