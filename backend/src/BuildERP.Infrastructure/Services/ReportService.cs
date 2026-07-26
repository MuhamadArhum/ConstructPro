using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Reports;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _db;
    public ReportService(ApplicationDbContext db) => _db = db;

    public async Task<IncomeExpenseReportDto> GetIncomeExpenseReportAsync(ReportQuery query, CancellationToken ct = default)
    {
        var incomeQ = _db.Incomes.AsQueryable();
        var expenseQ = _db.Expenses.AsQueryable();
        if (query.FromDate.HasValue) { incomeQ = incomeQ.Where(i => i.Date >= query.FromDate.Value); expenseQ = expenseQ.Where(e => e.Date >= query.FromDate.Value); }
        if (query.ToDate.HasValue) { incomeQ = incomeQ.Where(i => i.Date <= query.ToDate.Value); expenseQ = expenseQ.Where(e => e.Date <= query.ToDate.Value); }

        var totalIncome = await incomeQ.SumAsync(i => i.Amount, ct);
        var totalExpense = await expenseQ.SumAsync(e => e.Amount, ct);

        var incomeByMonth = await incomeQ.GroupBy(i => new { i.Date.Year, i.Date.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(i => i.Amount) }).ToListAsync(ct);
        var expenseByMonth = await expenseQ.GroupBy(e => new { e.Date.Year, e.Date.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(e => e.Amount) }).ToListAsync(ct);

        var months = incomeByMonth.Select(x => (x.Year, x.Month))
            .Union(expenseByMonth.Select(x => (x.Year, x.Month)))
            .OrderBy(x => x.Year).ThenBy(x => x.Month).ToList();

        var monthly = months.Select(m => new MonthlyReportItem
        {
            Year = m.Year, Month = m.Month,
            MonthName = new DateTime(m.Year, m.Month, 1).ToString("MMM yyyy"),
            Income = incomeByMonth.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month)?.Total ?? 0,
            Expense = expenseByMonth.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month)?.Total ?? 0,
        }).Select(m => { m.Profit = m.Income - m.Expense; return m; }).ToList();

        return new IncomeExpenseReportDto { TotalIncome = totalIncome, TotalExpense = totalExpense, NetProfit = totalIncome - totalExpense, Monthly = monthly };
    }

    public async Task<LabourReportDto> GetLabourReportAsync(ReportQuery query, CancellationToken ct = default)
    {
        var totalLabour = await _db.Labours.CountAsync(ct);
        var advancesQ = _db.LabourAdvances.AsQueryable();

        var attendanceQ = _db.LabourAttendances.Include(a => a.Labour).Where(a => a.IsPresent).AsQueryable();
        if (query.FromDate.HasValue) { attendanceQ = attendanceQ.Where(a => a.Date >= query.FromDate.Value); advancesQ = advancesQ.Where(a => a.Date >= query.FromDate.Value); }
        if (query.ToDate.HasValue) { attendanceQ = attendanceQ.Where(a => a.Date <= query.ToDate.Value); advancesQ = advancesQ.Where(a => a.Date <= query.ToDate.Value); }

        var attendances = await attendanceQ.ToListAsync(ct);
        var wages = attendances.Sum(a => a.Labour.DailyWage);
        var overtime = attendances.Sum(a => a.OvertimeHours * a.Labour.OvertimeRatePerHour);
        var advances = await advancesQ.SumAsync(a => a.Amount, ct);
        return new LabourReportDto { TotalLabour = totalLabour, TotalWagesPaid = wages, TotalOvertimePaid = overtime, TotalAdvancesPaid = advances };
    }

    public async Task<InventoryReportDto> GetInventoryReportAsync(CancellationToken ct = default)
    {
        var items = await _db.InventoryItems.ToListAsync(ct);
        var lowStock = items.Where(i => i.CurrentStock <= i.LowStockThreshold).ToList();
        var totalValue = items.Sum(i => i.CurrentStock * (i.UnitPrice ?? 0));
        return new InventoryReportDto
        {
            TotalItems = items.Count,
            LowStockItems = lowStock.Count,
            TotalStockValue = totalValue,
            LowStockList = lowStock.Select(i => new LowStockItem { Name = i.Name, CurrentStock = i.CurrentStock, Threshold = i.LowStockThreshold, Unit = i.Unit }).ToList()
        };
    }

    public async Task<TaxReportDto> GetTaxReportAsync(ReportQuery query, CancellationToken ct = default)
    {
        var q = _db.TaxRecords.AsQueryable();
        if (query.FromDate.HasValue) q = q.Where(t => t.PeriodStart >= query.FromDate.Value);
        if (query.ToDate.HasValue) q = q.Where(t => t.PeriodEnd <= query.ToDate.Value);
        var records = await q.ToListAsync(ct);
        return new TaxReportDto
        {
            TotalTax = records.Sum(t => t.Amount),
            TotalPaid = records.Where(t => t.IsPaid).Sum(t => t.Amount),
            TotalPending = records.Where(t => !t.IsPaid).Sum(t => t.Amount),
            ByType = records.GroupBy(t => t.TaxType.ToString())
                .Select(g => new TaxBreakdownItem { TaxType = g.Key, Amount = g.Sum(t => t.Amount), IsPaid = g.All(t => t.IsPaid) }).ToList()
        };
    }
}
