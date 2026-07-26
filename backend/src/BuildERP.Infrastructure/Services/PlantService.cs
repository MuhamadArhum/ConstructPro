using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Plants;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class PlantService : IPlantService
{
    private readonly ApplicationDbContext _db;
    public PlantService(ApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<PlantDto>> GetAllAsync(PlantQuery query, CancellationToken ct = default)
    {
        var q = _db.Plants.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(s) ||
                             (p.Type != null && p.Type.ToLower().Contains(s)) ||
                             (p.Manufacturer != null && p.Manufacturer.ToLower().Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<PlantStatus>(query.Status, true, out var status))
            q = q.Where(p => p.Status == status);

        q = q.OrderByDescending(p => p.CreatedAt);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<PlantDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<PlantDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Plants.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Plant {id} not found.");
        return MapToDto(entity);
    }

    public async Task<PlantDto> CreateAsync(CreatePlantRequest request, CancellationToken ct = default)
    {
        var entity = new Plant
        {
            Name = request.Name, Type = request.Type, Manufacturer = request.Manufacturer,
            SerialNumber = request.SerialNumber, PurchaseDate = request.PurchaseDate,
            PurchasePrice = request.PurchasePrice, CurrentValue = request.CurrentValue,
            Status = request.Status, Location = request.Location,
            LastMaintenanceDate = request.LastMaintenanceDate, NextMaintenanceDate = request.NextMaintenanceDate,
            Notes = request.Notes
        };
        _db.Plants.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<PlantDto> UpdateAsync(Guid id, UpdatePlantRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Plants.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Plant {id} not found.");
        entity.Name = request.Name; entity.Type = request.Type; entity.Manufacturer = request.Manufacturer;
        entity.SerialNumber = request.SerialNumber; entity.PurchaseDate = request.PurchaseDate;
        entity.PurchasePrice = request.PurchasePrice; entity.CurrentValue = request.CurrentValue;
        entity.Status = request.Status; entity.Location = request.Location;
        entity.LastMaintenanceDate = request.LastMaintenanceDate; entity.NextMaintenanceDate = request.NextMaintenanceDate;
        entity.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Plants.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Plant {id} not found.");
        _db.Plants.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    private static PlantDto MapToDto(Plant p) => new()
    {
        Id = p.Id, Name = p.Name, Type = p.Type, Manufacturer = p.Manufacturer,
        SerialNumber = p.SerialNumber, PurchaseDate = p.PurchaseDate, PurchasePrice = p.PurchasePrice,
        CurrentValue = p.CurrentValue, Status = p.Status, StatusDisplay = p.Status.ToString(),
        Location = p.Location, LastMaintenanceDate = p.LastMaintenanceDate,
        NextMaintenanceDate = p.NextMaintenanceDate, Notes = p.Notes, CreatedAt = p.CreatedAt
    };
}
