using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Machinery;
namespace BuildERP.Application.Common.Interfaces;
public interface IMachineryService
{
    Task<PaginatedList<MachineryDto>> GetAllAsync(int page, int pageSize, string? search, string? status, CancellationToken ct = default);
    Task<MachineryDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<MachineryDto> CreateAsync(CreateMachineryRequest request, CancellationToken ct = default);
    Task<MachineryDto> UpdateAsync(Guid id, UpdateMachineryRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<MachineryMaintenanceDto> AddMaintenanceAsync(Guid machineryId, AddMaintenanceRequest request, CancellationToken ct = default);
    Task<List<MachineryMaintenanceDto>> GetMaintenanceHistoryAsync(Guid machineryId, CancellationToken ct = default);
    Task<List<MachineryDto>> GetDueForMaintenanceAsync(CancellationToken ct = default);
}
