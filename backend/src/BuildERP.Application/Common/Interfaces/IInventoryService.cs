using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Inventory;
namespace BuildERP.Application.Common.Interfaces;
public interface IInventoryService
{
    Task<PaginatedList<InventoryItemDto>> GetAllAsync(InventoryQuery query, CancellationToken ct = default);
    Task<InventoryItemDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<InventoryItemDto> CreateAsync(CreateInventoryItemRequest request, CancellationToken ct = default);
    Task<InventoryItemDto> UpdateAsync(Guid id, UpdateInventoryItemRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<List<StockTransactionDto>> GetTransactionsAsync(Guid itemId, CancellationToken ct = default);
    Task<StockTransactionDto> AddTransactionAsync(Guid itemId, AddStockTransactionRequest request, CancellationToken ct = default);
}
