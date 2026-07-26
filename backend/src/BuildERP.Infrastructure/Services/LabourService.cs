using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Labour;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class LabourService : ILabourService
{
    private readonly ApplicationDbContext _db;

    public LabourService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedList<LabourDto>> GetAllAsync(int page, int pageSize, string? search, string? trade, bool? isActive, CancellationToken ct = default)
    {
        var q = _db.Labours.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            q = q.Where(l =>
                l.Name.ToLower().Contains(s) ||
                (l.CNIC != null && l.CNIC.ToLower().Contains(s)) ||
                (l.Trade != null && l.Trade.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(trade))
            q = q.Where(l => l.Trade != null && l.Trade.ToLower().Contains(trade.ToLower()));

        if (isActive.HasValue)
            q = q.Where(l => l.IsActive == isActive.Value);

        q = q.OrderBy(l => l.Name);

        var totalCount = await q.CountAsync(ct);
        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var ids = items.Select(l => l.Id).ToList();
        var advanceSums = await _db.LabourAdvances
            .Where(a => ids.Contains(a.LabourId))
            .GroupBy(a => a.LabourId)
            .Select(g => new { LabourId = g.Key, Total = g.Sum(a => a.Amount) })
            .ToDictionaryAsync(x => x.LabourId, x => x.Total, ct);

        var dtos = items.Select(l => MapToDto(l, advanceSums.GetValueOrDefault(l.Id, 0))).ToList();
        return new PaginatedList<LabourDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<LabourDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Labours
            .Include(l => l.Attendances)
            .Include(l => l.Advances)
            .FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw new KeyNotFoundException($"Labour {id} not found.");

        var totalAdvances = entity.Advances.Sum(a => a.Amount);
        return MapToDto(entity, totalAdvances);
    }

    public async Task<LabourDto> CreateAsync(CreateLabourRequest request, CancellationToken ct = default)
    {
        var entity = new Labour
        {
            Name = request.Name,
            PhoneNumber = request.PhoneNumber,
            CNIC = request.CNIC,
            Address = request.Address,
            Trade = request.Trade,
            DailyWage = request.DailyWage,
            OvertimeRatePerHour = request.OvertimeRatePerHour,
            JoinDate = request.JoinDate,
            IsActive = true
        };

        _db.Labours.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity, 0);
    }

    public async Task<LabourDto> UpdateAsync(Guid id, UpdateLabourRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Labours.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Labour {id} not found.");

        entity.Name = request.Name;
        entity.PhoneNumber = request.PhoneNumber;
        entity.CNIC = request.CNIC;
        entity.Address = request.Address;
        entity.Trade = request.Trade;
        entity.DailyWage = request.DailyWage;
        entity.OvertimeRatePerHour = request.OvertimeRatePerHour;
        entity.JoinDate = request.JoinDate;

        await _db.SaveChangesAsync(ct);

        var totalAdvances = await _db.LabourAdvances.Where(a => a.LabourId == id).SumAsync(a => a.Amount, ct);
        return MapToDto(entity, totalAdvances);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Labours.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Labour {id} not found.");
        entity.IsActive = false;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<LabourAttendanceDto> UpsertAttendanceAsync(UpsertAttendanceRequest request, CancellationToken ct = default)
    {
        var labour = await _db.Labours.FindAsync(new object[] { request.LabourId }, ct)
            ?? throw new KeyNotFoundException($"Labour {request.LabourId} not found.");

        var dateOnly = request.Date.Date;
        var existing = await _db.LabourAttendances
            .FirstOrDefaultAsync(a => a.LabourId == request.LabourId && a.Date == dateOnly, ct);

        if (existing == null)
        {
            existing = new LabourAttendance
            {
                LabourId = request.LabourId,
                Date = dateOnly
            };
            _db.LabourAttendances.Add(existing);
        }

        existing.IsPresent = request.IsPresent;
        existing.OvertimeHours = request.OvertimeHours;
        existing.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);

        return MapAttendanceDto(existing, labour);
    }

    public async Task<List<LabourAttendanceDto>> GetAttendanceAsync(Guid labourId, int month, int year, CancellationToken ct = default)
    {
        var labour = await _db.Labours.FindAsync(new object[] { labourId }, ct)
            ?? throw new KeyNotFoundException($"Labour {labourId} not found.");

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var attendances = await _db.LabourAttendances
            .Where(a => a.LabourId == labourId && a.Date >= startDate && a.Date < endDate)
            .OrderBy(a => a.Date)
            .ToListAsync(ct);

        return attendances.Select(a => MapAttendanceDto(a, labour)).ToList();
    }

    public async Task<LabourAdvanceDto> AddAdvanceAsync(Guid labourId, AddAdvanceRequest request, CancellationToken ct = default)
    {
        var labour = await _db.Labours.FindAsync(new object[] { labourId }, ct)
            ?? throw new KeyNotFoundException($"Labour {labourId} not found.");

        var advance = new LabourAdvance
        {
            LabourId = labourId,
            Amount = request.Amount,
            Date = request.Date,
            Reason = request.Reason
        };

        _db.LabourAdvances.Add(advance);
        await _db.SaveChangesAsync(ct);

        return new LabourAdvanceDto
        {
            Id = advance.Id,
            LabourId = advance.LabourId,
            LabourName = labour.Name,
            Amount = advance.Amount,
            Date = advance.Date,
            Reason = advance.Reason
        };
    }

    public async Task<List<LabourAdvanceDto>> GetAdvancesAsync(Guid labourId, CancellationToken ct = default)
    {
        var labour = await _db.Labours.FindAsync(new object[] { labourId }, ct)
            ?? throw new KeyNotFoundException($"Labour {labourId} not found.");

        var advances = await _db.LabourAdvances
            .Where(a => a.LabourId == labourId)
            .OrderByDescending(a => a.Date)
            .ToListAsync(ct);

        return advances.Select(a => new LabourAdvanceDto
        {
            Id = a.Id,
            LabourId = a.LabourId,
            LabourName = labour.Name,
            Amount = a.Amount,
            Date = a.Date,
            Reason = a.Reason
        }).ToList();
    }

    public async Task<LabourLedgerDto> GetLedgerAsync(Guid labourId, int month, int year, CancellationToken ct = default)
    {
        var labour = await _db.Labours.FindAsync(new object[] { labourId }, ct)
            ?? throw new KeyNotFoundException($"Labour {labourId} not found.");

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var attendances = await _db.LabourAttendances
            .Where(a => a.LabourId == labourId && a.Date >= startDate && a.Date < endDate)
            .OrderBy(a => a.Date)
            .ToListAsync(ct);

        var advances = await _db.LabourAdvances
            .Where(a => a.LabourId == labourId && a.Date >= startDate && a.Date < endDate)
            .OrderBy(a => a.Date)
            .ToListAsync(ct);

        var totalAdvancesAllTime = await _db.LabourAdvances.Where(a => a.LabourId == labourId).SumAsync(a => a.Amount, ct);

        var attendanceDtos = attendances.Select(a => MapAttendanceDto(a, labour)).ToList();
        var totalEarnings = attendanceDtos.Sum(a => a.TotalPay);
        var totalAdvancesThisMonth = advances.Sum(a => a.Amount);

        return new LabourLedgerDto
        {
            Labour = MapToDto(labour, totalAdvancesAllTime),
            TotalEarnings = totalEarnings,
            TotalAdvances = totalAdvancesThisMonth,
            NetPayable = totalEarnings - totalAdvancesThisMonth,
            Attendances = attendanceDtos,
            Advances = advances.Select(a => new LabourAdvanceDto
            {
                Id = a.Id,
                LabourId = a.LabourId,
                LabourName = labour.Name,
                Amount = a.Amount,
                Date = a.Date,
                Reason = a.Reason
            }).ToList()
        };
    }

    private static LabourDto MapToDto(Labour l, decimal totalAdvances) => new()
    {
        Id = l.Id,
        Name = l.Name,
        PhoneNumber = l.PhoneNumber,
        CNIC = l.CNIC,
        Trade = l.Trade,
        DailyWage = l.DailyWage,
        OvertimeRatePerHour = l.OvertimeRatePerHour,
        JoinDate = l.JoinDate,
        IsActive = l.IsActive,
        TotalAdvances = totalAdvances
    };

    private static LabourAttendanceDto MapAttendanceDto(LabourAttendance a, Labour labour)
    {
        var overtimePay = a.OvertimeHours * labour.OvertimeRatePerHour;
        var totalPay = (a.IsPresent ? labour.DailyWage : 0) + overtimePay;
        return new LabourAttendanceDto
        {
            Id = a.Id,
            LabourId = a.LabourId,
            LabourName = labour.Name,
            Date = a.Date,
            IsPresent = a.IsPresent,
            OvertimeHours = a.OvertimeHours,
            Notes = a.Notes,
            DailyWage = labour.DailyWage,
            OvertimePay = overtimePay,
            TotalPay = totalPay
        };
    }
}
