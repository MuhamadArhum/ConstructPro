using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Plants;
namespace BuildERP.Application.Common.Interfaces;
public interface IPlantService
{
    Task<PaginatedList<PlantDto>> GetAllAsync(PlantQuery query, CancellationToken ct = default);
    Task<PlantDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PlantDto> CreateAsync(CreatePlantRequest request, CancellationToken ct = default);
    Task<PlantDto> UpdateAsync(Guid id, UpdatePlantRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
