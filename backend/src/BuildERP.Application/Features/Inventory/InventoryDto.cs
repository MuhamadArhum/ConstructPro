using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Inventory;
public class InventoryItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal LowStockThreshold { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? SupplierName { get; set; }
    public string? Location { get; set; }
    public bool IsLowStock { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class CreateInventoryItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal LowStockThreshold { get; set; } = 10;
    public decimal? UnitPrice { get; set; }
    public string? SupplierName { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
}
public class UpdateInventoryItemRequest : CreateInventoryItemRequest { }
public class InventoryQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Category { get; set; }
    public bool? LowStock { get; set; }
}
public class StockTransactionDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public StockTransactionType Type { get; set; }
    public string TypeDisplay { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime Date { get; set; }
    public string? Reference { get; set; }
    public string? ProjectName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class AddStockTransactionRequest
{
    public StockTransactionType Type { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime Date { get; set; }
    public string? Reference { get; set; }
    public string? ProjectName { get; set; }
    public string? Notes { get; set; }
}
