using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ExpenseCategory Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Vendor { get; set; }
    public string? BillPath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedById { get; set; }
}
