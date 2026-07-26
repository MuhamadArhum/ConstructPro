namespace BuildERP.Application.Features.Reports;
public class IncomeExpenseReportDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal NetProfit { get; set; }
    public List<MonthlyReportItem> Monthly { get; set; } = new();
}
public class MonthlyReportItem
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
    public decimal Profit { get; set; }
}
public class LabourReportDto
{
    public int TotalLabour { get; set; }
    public decimal TotalWagesPaid { get; set; }
    public decimal TotalAdvancesPaid { get; set; }
    public decimal TotalOvertimePaid { get; set; }
}
public class InventoryReportDto
{
    public int TotalItems { get; set; }
    public int LowStockItems { get; set; }
    public decimal TotalStockValue { get; set; }
    public List<LowStockItem> LowStockList { get; set; } = new();
}
public class LowStockItem
{
    public string Name { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal Threshold { get; set; }
    public string? Unit { get; set; }
}
public class TaxReportDto
{
    public decimal TotalTax { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalPending { get; set; }
    public List<TaxBreakdownItem> ByType { get; set; } = new();
}
public class TaxBreakdownItem
{
    public string TaxType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; }
}
public class ReportQuery
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
