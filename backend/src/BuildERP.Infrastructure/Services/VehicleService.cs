using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Vehicles;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class VehicleService : IVehicleService
{
    private readonly ApplicationDbContext _db;
    public VehicleService(ApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<VehicleDto>> GetAllAsync(VehicleQuery query, CancellationToken ct = default)
    {
        var q = _db.Vehicles.Include(v => v.MaintenanceRecords).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(v => v.RegistrationNumber.ToLower().Contains(s) ||
                             v.Make.ToLower().Contains(s) ||
                             (v.Model != null && v.Model.ToLower().Contains(s)) ||
                             (v.DriverName != null && v.DriverName.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<VehicleStatus>(query.Status, true, out var status))
            q = q.Where(v => v.Status == status);

        q = q.OrderByDescending(v => v.CreatedAt);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<VehicleDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<VehicleDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Vehicles.Include(v => v.MaintenanceRecords)
            .FirstOrDefaultAsync(v => v.Id == id, ct)
            ?? throw new KeyNotFoundException($"Vehicle {id} not found.");
        return MapToDto(entity);
    }

    public async Task<VehicleDto> CreateAsync(CreateVehicleRequest request, CancellationToken ct = default)
    {
        var entity = new Vehicle
        {
            RegistrationNumber = request.RegistrationNumber,
            Make = request.Make,
            Model = request.Model,
            Year = request.Year,
            DriverName = request.DriverName,
            DriverContact = request.DriverContact,
            PurchasePrice = request.PurchasePrice,
            PurchaseDate = request.PurchaseDate,
            Status = request.Status,
            Notes = request.Notes
        };
        _db.Vehicles.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<VehicleDto> UpdateAsync(Guid id, UpdateVehicleRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Vehicles.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Vehicle {id} not found.");
        entity.RegistrationNumber = request.RegistrationNumber;
        entity.Make = request.Make;
        entity.Model = request.Model;
        entity.Year = request.Year;
        entity.DriverName = request.DriverName;
        entity.DriverContact = request.DriverContact;
        entity.PurchasePrice = request.PurchasePrice;
        entity.PurchaseDate = request.PurchaseDate;
        entity.Status = request.Status;
        entity.TotalMileage = request.TotalMileage;
        entity.NextMaintenanceDate = request.NextMaintenanceDate;
        entity.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Vehicles.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Vehicle {id} not found.");
        _db.Vehicles.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<VehicleMaintenanceDto>> GetMaintenanceAsync(Guid vehicleId, CancellationToken ct = default)
    {
        var records = await _db.VehicleMaintenances
            .Where(m => m.VehicleId == vehicleId)
            .OrderByDescending(m => m.MaintenanceDate)
            .ToListAsync(ct);
        return records.Select(MapMaintenanceToDto).ToList();
    }

    public async Task<VehicleMaintenanceDto> AddMaintenanceAsync(Guid vehicleId, CreateVehicleMaintenanceRequest request, CancellationToken ct = default)
    {
        var vehicle = await _db.Vehicles.FindAsync(new object[] { vehicleId }, ct)
            ?? throw new KeyNotFoundException($"Vehicle {vehicleId} not found.");
        var record = new VehicleMaintenance
        {
            VehicleId = vehicleId,
            MaintenanceDate = request.MaintenanceDate,
            Description = request.Description,
            Cost = request.Cost,
            ServiceProvider = request.ServiceProvider,
            NextDueDate = request.NextDueDate,
            MileageAtService = request.MileageAtService,
            Notes = request.Notes
        };
        if (request.NextDueDate.HasValue)
            vehicle.NextMaintenanceDate = request.NextDueDate;
        _db.VehicleMaintenances.Add(record);
        await _db.SaveChangesAsync(ct);
        return MapMaintenanceToDto(record);
    }

    private static VehicleDto MapToDto(Vehicle v) => new()
    {
        Id = v.Id,
        RegistrationNumber = v.RegistrationNumber,
        Make = v.Make,
        Model = v.Model,
        Year = v.Year,
        DriverName = v.DriverName,
        DriverContact = v.DriverContact,
        PurchasePrice = v.PurchasePrice,
        PurchaseDate = v.PurchaseDate,
        Status = v.Status,
        StatusDisplay = v.Status.ToString(),
        TotalMileage = v.TotalMileage,
        NextMaintenanceDate = v.NextMaintenanceDate,
        Notes = v.Notes,
        CreatedAt = v.CreatedAt,
        MaintenanceCount = v.MaintenanceRecords?.Count ?? 0
    };

    private static VehicleMaintenanceDto MapMaintenanceToDto(VehicleMaintenance m) => new()
    {
        Id = m.Id,
        VehicleId = m.VehicleId,
        MaintenanceDate = m.MaintenanceDate,
        Description = m.Description,
        Cost = m.Cost,
        ServiceProvider = m.ServiceProvider,
        NextDueDate = m.NextDueDate,
        MileageAtService = m.MileageAtService,
        Notes = m.Notes,
        CreatedAt = m.CreatedAt
    };
}
