using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Income;
namespace BuildERP.Application.Common.Interfaces;
public interface IIncomeService
{
    Task<PaginatedList<IncomeDto>> GetAllAsync(IncomeQuery query, CancellationToken ct = default);
    Task<IncomeDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IncomeDto> CreateAsync(CreateIncomeRequest request, CancellationToken ct = default);
    Task<IncomeDto> UpdateAsync(Guid id, UpdateIncomeRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<IncomeSummaryDto> GetSummaryAsync(CancellationToken ct = default);
}
