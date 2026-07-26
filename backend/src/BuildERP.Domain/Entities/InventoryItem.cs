namespace BuildERP.Domain.Entities;
public class InventoryItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal LowStockThreshold { get; set; } = 10;
    public decimal? UnitPrice { get; set; }
    public string? SupplierName { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}
