using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Income;
public class IncomeDto
{
    public Guid Id { get; set; }
    public IncomeCategory Category { get; set; }
    public string CategoryDisplay { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? ProjectName { get; set; }
    public string? ReceiptPath { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; }
}
