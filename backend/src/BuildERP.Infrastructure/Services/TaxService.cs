using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Taxes;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class TaxService : ITaxService
{
    private readonly ApplicationDbContext _db;
    public TaxService(ApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<TaxRecordDto>> GetAllAsync(TaxQuery query, CancellationToken ct = default)
    {
        var q = _db.TaxRecords.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(t => (t.Reference != null && t.Reference.ToLower().Contains(s)) ||
                             (t.Description != null && t.Description.ToLower().Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(query.TaxType) && Enum.TryParse<TaxType>(query.TaxType, true, out var tt))
            q = q.Where(t => t.TaxType == tt);
        if (query.IsPaid.HasValue) q = q.Where(t => t.IsPaid == query.IsPaid.Value);
        if (query.FromDate.HasValue) q = q.Where(t => t.PeriodStart >= query.FromDate.Value);
        if (query.ToDate.HasValue) q = q.Where(t => t.PeriodEnd <= query.ToDate.Value);

        q = q.OrderByDescending(t => t.PeriodEnd);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<TaxRecordDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<TaxRecordDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.TaxRecords.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"TaxRecord {id} not found.");
        return MapToDto(entity);
    }

    public async Task<TaxRecordDto> CreateAsync(CreateTaxRecordRequest request, CancellationToken ct = default)
    {
        var entity = new TaxRecord
        {
            TaxType = request.TaxType, Amount = request.Amount,
            PeriodStart = request.PeriodStart, PeriodEnd = request.PeriodEnd,
            DueDate = request.DueDate, PaidDate = request.PaidDate,
            IsPaid = request.IsPaid, Reference = request.Reference,
            Description = request.Description, Notes = request.Notes
        };
        _db.TaxRecords.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<TaxRecordDto> UpdateAsync(Guid id, UpdateTaxRecordRequest request, CancellationToken ct = default)
    {
        var entity = await _db.TaxRecords.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"TaxRecord {id} not found.");
        entity.TaxType = request.TaxType; entity.Amount = request.Amount;
        entity.PeriodStart = request.PeriodStart; entity.PeriodEnd = request.PeriodEnd;
        entity.DueDate = request.DueDate; entity.PaidDate = request.PaidDate;
        entity.IsPaid = request.IsPaid; entity.Reference = request.Reference;
        entity.Description = request.Description; entity.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.TaxRecords.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"TaxRecord {id} not found.");
        _db.TaxRecords.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<TaxSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var total = await _db.TaxRecords.SumAsync(t => t.Amount, ct);
        var paid = await _db.TaxRecords.Where(t => t.IsPaid).SumAsync(t => t.Amount, ct);
        var pending = await _db.TaxRecords.Where(t => !t.IsPaid).SumAsync(t => t.Amount, ct);
        var overdue = await _db.TaxRecords.CountAsync(t => !t.IsPaid && t.DueDate.HasValue && t.DueDate.Value < now, ct);
        return new TaxSummaryDto { TotalTax = total, TotalPaid = paid, TotalPending = pending, OverdueCount = overdue };
    }

    private static TaxRecordDto MapToDto(TaxRecord t) => new()
    {
        Id = t.Id, TaxType = t.TaxType, TaxTypeDisplay = t.TaxType.ToString(),
        Amount = t.Amount, PeriodStart = t.PeriodStart, PeriodEnd = t.PeriodEnd,
        DueDate = t.DueDate, PaidDate = t.PaidDate, IsPaid = t.IsPaid,
        Reference = t.Reference, Description = t.Description, Notes = t.Notes, CreatedAt = t.CreatedAt
    };
}
