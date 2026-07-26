using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class StockTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InventoryItemId { get; set; }
    public InventoryItem InventoryItem { get; set; } = null!;
    public StockTransactionType Type { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime Date { get; set; }
    public string? Reference { get; set; }
    public string? ProjectName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedById { get; set; }
}
