using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Expense;
public class UpdateExpenseRequest
{
    public ExpenseCategory Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Vendor { get; set; }
}
