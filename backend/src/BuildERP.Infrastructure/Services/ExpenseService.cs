using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Expense;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace BuildERP.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly ApplicationDbContext _db;

    public ExpenseService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedList<ExpenseDto>> GetAllAsync(ExpenseQuery query, CancellationToken ct = default)
    {
        var q = _db.Expenses.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(e =>
                e.Description.ToLower().Contains(s) ||
                (e.Vendor != null && e.Vendor.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Category) &&
            Enum.TryParse<ExpenseCategory>(query.Category, true, out var cat))
        {
            q = q.Where(e => e.Category == cat);
        }

        if (query.FromDate.HasValue)
            q = q.Where(e => e.Date >= query.FromDate.Value);

        if (query.ToDate.HasValue)
            q = q.Where(e => e.Date <= query.ToDate.Value);

        q = q.OrderByDescending(e => e.Date);

        var totalCount = await q.CountAsync(ct);
        var items = await q
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedList<ExpenseDto>(dtos, totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<ExpenseDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Expenses.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");
        return MapToDto(entity);
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseRequest request, CancellationToken ct = default)
    {
        var entity = new Expense
        {
            Category = request.Category,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description,
            Vendor = request.Vendor,
            CreatedAt = DateTime.UtcNow
        };

        _db.Expenses.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<ExpenseDto> UpdateAsync(Guid id, UpdateExpenseRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Expenses.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");

        entity.Category = request.Category;
        entity.Amount = request.Amount;
        entity.Date = request.Date;
        entity.Description = request.Description;
        entity.Vendor = request.Vendor;

        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Expenses.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");
        _db.Expenses.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ExpenseSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalAllTime = await _db.Expenses.SumAsync(e => e.Amount, ct);
        var totalThisMonth = await _db.Expenses
            .Where(e => e.Date >= startOfMonth)
            .SumAsync(e => e.Amount, ct);

        var byCategory = await _db.Expenses
            .GroupBy(e => e.Category)
            .Select(g => new { Category = g.Key, Total = g.Sum(e => e.Amount) })
            .ToListAsync(ct);

        return new ExpenseSummaryDto
        {
            TotalAllTime = totalAllTime,
            TotalThisMonth = totalThisMonth,
            ByCategory = byCategory.ToDictionary(
                x => AddSpacesToPascalCase(x.Category.ToString()),
                x => x.Total)
        };
    }

    private static ExpenseDto MapToDto(Expense entity) => new()
    {
        Id = entity.Id,
        Category = entity.Category,
        CategoryDisplay = AddSpacesToPascalCase(entity.Category.ToString()),
        Amount = entity.Amount,
        Date = entity.Date,
        Description = entity.Description,
        Vendor = entity.Vendor,
        BillPath = entity.BillPath,
        CreatedAt = entity.CreatedAt
    };

    private static string AddSpacesToPascalCase(string text)
        => Regex.Replace(text, "([A-Z])", " $1").Trim();
}
