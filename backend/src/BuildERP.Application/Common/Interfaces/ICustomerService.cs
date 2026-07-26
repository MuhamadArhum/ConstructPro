using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Customers;
namespace BuildERP.Application.Common.Interfaces;
public interface ICustomerService
{
    Task<PaginatedList<CustomerDto>> GetAllAsync(CustomerQuery query, CancellationToken ct = default);
    Task<CustomerDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CustomerDto> CreateAsync(CreateCustomerRequest request, CancellationToken ct = default);
    Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
