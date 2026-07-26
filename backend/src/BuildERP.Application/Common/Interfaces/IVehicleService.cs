using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Vehicles;
namespace BuildERP.Application.Common.Interfaces;
public interface IVehicleService
{
    Task<PaginatedList<VehicleDto>> GetAllAsync(VehicleQuery query, CancellationToken ct = default);
    Task<VehicleDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<VehicleDto> CreateAsync(CreateVehicleRequest request, CancellationToken ct = default);
    Task<VehicleDto> UpdateAsync(Guid id, UpdateVehicleRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<List<VehicleMaintenanceDto>> GetMaintenanceAsync(Guid vehicleId, CancellationToken ct = default);
    Task<VehicleMaintenanceDto> AddMaintenanceAsync(Guid vehicleId, CreateVehicleMaintenanceRequest request, CancellationToken ct = default);
}
