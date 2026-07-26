using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Taxes;
namespace BuildERP.Application.Common.Interfaces;
public interface ITaxService
{
    Task<PaginatedList<TaxRecordDto>> GetAllAsync(TaxQuery query, CancellationToken ct = default);
    Task<TaxRecordDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TaxRecordDto> CreateAsync(CreateTaxRecordRequest request, CancellationToken ct = default);
    Task<TaxRecordDto> UpdateAsync(Guid id, UpdateTaxRecordRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<TaxSummaryDto> GetSummaryAsync(CancellationToken ct = default);
}
