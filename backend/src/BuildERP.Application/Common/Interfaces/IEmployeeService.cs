using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Employees;
namespace BuildERP.Application.Common.Interfaces;
public interface IEmployeeService
{
    Task<PaginatedList<EmployeeDto>> GetAllAsync(int page, int pageSize, string? search, string? department, bool? isActive, CancellationToken ct = default);
    Task<EmployeeDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<EmployeeDto> CreateAsync(CreateEmployeeRequest request, CancellationToken ct = default);
    Task<EmployeeDto> UpdateAsync(Guid id, UpdateEmployeeRequest request, CancellationToken ct = default);
    Task DeactivateAsync(Guid id, CancellationToken ct = default);
    Task<SalaryPaymentDto> ProcessSalaryAsync(Guid employeeId, ProcessSalaryRequest request, CancellationToken ct = default);
    Task<List<SalaryPaymentDto>> GetSalaryHistoryAsync(Guid employeeId, CancellationToken ct = default);
    Task<List<SalaryPaymentDto>> GetAllSalariesAsync(int month, int year, CancellationToken ct = default);
}
