namespace BuildERP.Application.Features.Expense;
public class ExpenseSummaryDto
{
    public decimal TotalAllTime { get; set; }
    public decimal TotalThisMonth { get; set; }
    public Dictionary<string, decimal> ByCategory { get; set; } = new();
}
