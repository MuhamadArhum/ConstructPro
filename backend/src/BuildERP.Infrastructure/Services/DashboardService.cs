using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Dashboard;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _db;

    public DashboardService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var maintenanceThreshold = now.AddDays(7);

        // Aggregate queries
        var totalIncomeAllTime = await _db.Incomes.SumAsync(i => i.Amount, ct);
        var totalExpenseAllTime = await _db.Expenses.SumAsync(e => e.Amount, ct);
        var totalIncomeThisMonth = await _db.Incomes
            .Where(i => i.Date >= startOfMonth).SumAsync(i => i.Amount, ct);
        var totalExpenseThisMonth = await _db.Expenses
            .Where(e => e.Date >= startOfMonth).SumAsync(e => e.Amount, ct);
        var pendingPayments = await _db.Incomes
            .Where(i => !i.IsPaid).SumAsync(i => i.Amount, ct);

        var activeLabourCount = await _db.Labours.CountAsync(l => l.IsActive, ct);
        var activeEmployeeCount = await _db.Employees.CountAsync(e => e.IsActive, ct);
        var activeMachineryCount = await _db.Machineries.CountAsync(m => m.Status == MachineryStatus.Active, ct);
        var maintenanceDueCount = await _db.Machineries
            .CountAsync(m => m.Status == MachineryStatus.Active &&
                             m.NextMaintenanceDate.HasValue &&
                             m.NextMaintenanceDate <= maintenanceThreshold, ct);

        // Monthly chart — last 6 months
        var sixMonthsAgo = now.AddMonths(-5);
        var chartStart = new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var incomeByMonth = await _db.Incomes
            .Where(i => i.Date >= chartStart)
            .GroupBy(i => new { i.Date.Year, i.Date.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(i => i.Amount) })
            .ToListAsync(ct);

        var expenseByMonth = await _db.Expenses
            .Where(e => e.Date >= chartStart)
            .GroupBy(e => new { e.Date.Year, e.Date.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(e => e.Amount) })
            .ToListAsync(ct);

        var monthlyChart = new List<MonthlyChartDataDto>();
        for (int i = 5; i >= 0; i--)
        {
            var month = now.AddMonths(-i);
            var income = incomeByMonth.FirstOrDefault(x => x.Year == month.Year && x.Month == month.Month)?.Total ?? 0;
            var expense = expenseByMonth.FirstOrDefault(x => x.Year == month.Year && x.Month == month.Month)?.Total ?? 0;
            monthlyChart.Add(new MonthlyChartDataDto
            {
                Month = month.ToString("MMM yyyy"),
                Income = income,
                Expense = expense,
                Profit = income - expense
            });
        }

        // Recent transactions — last 10 from income + expense combined
        var recentIncomes = await _db.Incomes
            .OrderByDescending(i => i.Date)
            .Take(10)
            .Select(i => new RecentTransactionDto
            {
                Id = i.Id,
                Type = "Income",
                Category = i.Category.ToString(),
                Amount = i.Amount,
                Date = i.Date,
                Description = i.Description
            })
            .ToListAsync(ct);

        var recentExpenses = await _db.Expenses
            .OrderByDescending(e => e.Date)
            .Take(10)
            .Select(e => new RecentTransactionDto
            {
                Id = e.Id,
                Type = "Expense",
                Category = e.Category.ToString(),
                Amount = e.Amount,
                Date = e.Date,
                Description = e.Description
            })
            .ToListAsync(ct);

        var recentTransactions = recentIncomes
            .Concat(recentExpenses)
            .OrderByDescending(t => t.Date)
            .Take(10)
            .ToList();

        return new DashboardStatsDto
        {
            TotalIncomeAllTime = totalIncomeAllTime,
            TotalExpenseAllTime = totalExpenseAllTime,
            ProfitLossAllTime = totalIncomeAllTime - totalExpenseAllTime,
            TotalIncomeThisMonth = totalIncomeThisMonth,
            TotalExpenseThisMonth = totalExpenseThisMonth,
            ProfitLossThisMonth = totalIncomeThisMonth - totalExpenseThisMonth,
            PendingPayments = pendingPayments,
            ActiveLabourCount = activeLabourCount,
            ActiveEmployeeCount = activeEmployeeCount,
            ActiveMachineryCount = activeMachineryCount,
            MaintenanceDueCount = maintenanceDueCount,
            MonthlyChart = monthlyChart,
            RecentTransactions = recentTransactions
        };
    }
}
