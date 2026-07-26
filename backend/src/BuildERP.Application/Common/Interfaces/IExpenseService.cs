using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Expense;
namespace BuildERP.Application.Common.Interfaces;
public interface IExpenseService
{
    Task<PaginatedList<ExpenseDto>> GetAllAsync(ExpenseQuery query, CancellationToken ct = default);
    Task<ExpenseDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ExpenseDto> CreateAsync(CreateExpenseRequest request, CancellationToken ct = default);
    Task<ExpenseDto> UpdateAsync(Guid id, UpdateExpenseRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<ExpenseSummaryDto> GetSummaryAsync(CancellationToken ct = default);
}
