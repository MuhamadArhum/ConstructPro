using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Expense;
public class ExpenseDto
{
    public Guid Id { get; set; }
    public ExpenseCategory Category { get; set; }
    public string CategoryDisplay { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Vendor { get; set; }
    public string? BillPath { get; set; }
    public DateTime CreatedAt { get; set; }
}
