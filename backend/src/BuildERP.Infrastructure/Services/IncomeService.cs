using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Income;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace BuildERP.Infrastructure.Services;

public class IncomeService : IIncomeService
{
    private readonly ApplicationDbContext _db;

    public IncomeService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedList<IncomeDto>> GetAllAsync(IncomeQuery query, CancellationToken ct = default)
    {
        var q = _db.Incomes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(i =>
                i.Description.ToLower().Contains(s) ||
                (i.CustomerName != null && i.CustomerName.ToLower().Contains(s)) ||
                (i.ProjectName != null && i.ProjectName.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Category) &&
            Enum.TryParse<IncomeCategory>(query.Category, true, out var cat))
        {
            q = q.Where(i => i.Category == cat);
        }

        if (query.FromDate.HasValue)
            q = q.Where(i => i.Date >= query.FromDate.Value);

        if (query.ToDate.HasValue)
            q = q.Where(i => i.Date <= query.ToDate.Value);

        q = q.OrderByDescending(i => i.Date);

        var totalCount = await q.CountAsync(ct);
        var items = await q
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedList<IncomeDto>(dtos, totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<IncomeDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Incomes.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Income {id} not found.");
        return MapToDto(entity);
    }

    public async Task<IncomeDto> CreateAsync(CreateIncomeRequest request, CancellationToken ct = default)
    {
        var entity = new Income
        {
            Category = request.Category,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description,
            CustomerName = request.CustomerName,
            ProjectName = request.ProjectName,
            IsPaid = request.IsPaid,
            CreatedAt = DateTime.UtcNow
        };

        _db.Incomes.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<IncomeDto> UpdateAsync(Guid id, UpdateIncomeRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Incomes.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Income {id} not found.");

        entity.Category = request.Category;
        entity.Amount = request.Amount;
        entity.Date = request.Date;
        entity.Description = request.Description;
        entity.CustomerName = request.CustomerName;
        entity.ProjectName = request.ProjectName;
        entity.IsPaid = request.IsPaid;

        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Incomes.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Income {id} not found.");
        _db.Incomes.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IncomeSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalAllTime = await _db.Incomes.SumAsync(i => i.Amount, ct);
        var totalThisMonth = await _db.Incomes
            .Where(i => i.Date >= startOfMonth)
            .SumAsync(i => i.Amount, ct);
        var totalPaid = await _db.Incomes
            .Where(i => i.IsPaid)
            .SumAsync(i => i.Amount, ct);
        var totalPending = await _db.Incomes
            .Where(i => !i.IsPaid)
            .SumAsync(i => i.Amount, ct);

        return new IncomeSummaryDto
        {
            TotalAllTime = totalAllTime,
            TotalThisMonth = totalThisMonth,
            TotalPaid = totalPaid,
            TotalPending = totalPending
        };
    }

    private static IncomeDto MapToDto(Income entity) => new()
    {
        Id = entity.Id,
        Category = entity.Category,
        CategoryDisplay = AddSpacesToPascalCase(entity.Category.ToString()),
        Amount = entity.Amount,
        Date = entity.Date,
        Description = entity.Description,
        CustomerName = entity.CustomerName,
        ProjectName = entity.ProjectName,
        ReceiptPath = entity.ReceiptPath,
        IsPaid = entity.IsPaid,
        CreatedAt = entity.CreatedAt
    };

    private static string AddSpacesToPascalCase(string text)
        => Regex.Replace(text, "([A-Z])", " $1").Trim();
}
