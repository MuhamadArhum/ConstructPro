using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class TaxRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public TaxType TaxType { get; set; }
    public decimal Amount { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public bool IsPaid { get; set; }
    public string? Reference { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedById { get; set; }
}
