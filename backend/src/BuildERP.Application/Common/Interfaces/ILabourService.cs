using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Labour;
namespace BuildERP.Application.Common.Interfaces;
public interface ILabourService
{
    Task<PaginatedList<LabourDto>> GetAllAsync(int page, int pageSize, string? search, string? trade, bool? isActive, CancellationToken ct = default);
    Task<LabourDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<LabourDto> CreateAsync(CreateLabourRequest request, CancellationToken ct = default);
    Task<LabourDto> UpdateAsync(Guid id, UpdateLabourRequest request, CancellationToken ct = default);
    Task DeactivateAsync(Guid id, CancellationToken ct = default);
    Task<LabourAttendanceDto> UpsertAttendanceAsync(UpsertAttendanceRequest request, CancellationToken ct = default);
    Task<List<LabourAttendanceDto>> GetAttendanceAsync(Guid labourId, int month, int year, CancellationToken ct = default);
    Task<LabourAdvanceDto> AddAdvanceAsync(Guid labourId, AddAdvanceRequest request, CancellationToken ct = default);
    Task<List<LabourAdvanceDto>> GetAdvancesAsync(Guid labourId, CancellationToken ct = default);
    Task<LabourLedgerDto> GetLedgerAsync(Guid labourId, int month, int year, CancellationToken ct = default);
}
