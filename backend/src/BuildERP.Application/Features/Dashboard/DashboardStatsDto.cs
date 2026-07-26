namespace BuildERP.Application.Features.Dashboard;
public class DashboardStatsDto
{
    public decimal TotalIncomeAllTime { get; set; }
    public decimal TotalExpenseAllTime { get; set; }
    public decimal ProfitLossAllTime { get; set; }
    public decimal TotalIncomeThisMonth { get; set; }
    public decimal TotalExpenseThisMonth { get; set; }
    public decimal ProfitLossThisMonth { get; set; }
    public decimal PendingPayments { get; set; }
    public int ActiveLabourCount { get; set; }
    public int ActiveEmployeeCount { get; set; }
    public int ActiveMachineryCount { get; set; }
    public int MaintenanceDueCount { get; set; }
    public List<MonthlyChartDataDto> MonthlyChart { get; set; } = new();
    public List<RecentTransactionDto> RecentTransactions { get; set; } = new();
}

public class MonthlyChartDataDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
    public decimal Profit { get; set; }
}

public class RecentTransactionDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
}
