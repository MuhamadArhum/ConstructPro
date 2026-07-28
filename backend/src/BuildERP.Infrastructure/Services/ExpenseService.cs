using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.AuditLogs;
using BuildERP.Application.Features.Expense;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace BuildERP.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly ApplicationDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ICurrentUserService _currentUser;

    public ExpenseService(ApplicationDbContext db, IAuditLogService auditLog, ICurrentUserService currentUser)
    {
        _db = db;
        _auditLog = auditLog;
        _currentUser = currentUser;
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
            q = q.Where(e => e.Category == cat);

        if (query.FromDate.HasValue) q = q.Where(e => e.Date >= query.FromDate.Value);
        if (query.ToDate.HasValue) q = q.Where(e => e.Date <= query.ToDate.Value);

        q = q.OrderByDescending(e => e.Date);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<ExpenseDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
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

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Create",
            EntityType = "Expense",
            EntityId = entity.Id.ToString(),
            NewValues = JsonSerializer.Serialize(new { entity.Category, entity.Amount, entity.Description, entity.Date }),
        }, ct);

        return MapToDto(entity);
    }

    public async Task<ExpenseDto> UpdateAsync(Guid id, UpdateExpenseRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Expenses.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");

        var oldValues = JsonSerializer.Serialize(new { entity.Category, entity.Amount, entity.Description, entity.Date });

        entity.Category = request.Category;
        entity.Amount = request.Amount;
        entity.Date = request.Date;
        entity.Description = request.Description;
        entity.Vendor = request.Vendor;

        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Update",
            EntityType = "Expense",
            EntityId = id.ToString(),
            OldValues = oldValues,
            NewValues = JsonSerializer.Serialize(new { entity.Category, entity.Amount, entity.Description, entity.Date }),
        }, ct);

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Expenses.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Expense {id} not found.");

        var oldValues = JsonSerializer.Serialize(new { entity.Category, entity.Amount, entity.Description, entity.Date });

        _db.Expenses.Remove(entity);
        await _db.SaveChangesAsync(ct);

        await _auditLog.LogAsync(new AuditLogEntry
        {
            UserId = _currentUser.UserId,
            UserEmail = _currentUser.Email ?? "",
            Action = "Delete",
            EntityType = "Expense",
            EntityId = id.ToString(),
            OldValues = oldValues,
        }, ct);
    }

    public async Task<ExpenseSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalAllTime = await _db.Expenses.SumAsync(e => e.Amount, ct);
        var totalThisMonth = await _db.Expenses.Where(e => e.Date >= startOfMonth).SumAsync(e => e.Amount, ct);

        var byCategory = await _db.Expenses
            .GroupBy(e => e.Category)
            .Select(g => new { Category = g.Key, Total = g.Sum(e => e.Amount) })
            .ToListAsync(ct);

        return new ExpenseSummaryDto
        {
            TotalAllTime = totalAllTime,
            TotalThisMonth = totalThisMonth,
            ByCategory = byCategory.ToDictionary(x => AddSpacesToPascalCase(x.Category.ToString()), x => x.Total)
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
