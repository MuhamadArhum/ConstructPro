using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class Income
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public IncomeCategory Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? ProjectName { get; set; }
    public string? ReceiptPath { get; set; }
    public bool IsPaid { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedById { get; set; }
}
