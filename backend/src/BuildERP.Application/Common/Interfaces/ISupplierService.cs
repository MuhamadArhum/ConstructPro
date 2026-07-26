using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Suppliers;
namespace BuildERP.Application.Common.Interfaces;
public interface ISupplierService
{
    Task<PaginatedList<SupplierDto>> GetAllAsync(SupplierQuery query, CancellationToken ct = default);
    Task<SupplierDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<SupplierDto> CreateAsync(CreateSupplierRequest request, CancellationToken ct = default);
    Task<SupplierDto> UpdateAsync(Guid id, UpdateSupplierRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
