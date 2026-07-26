using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.AuditLogs;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Identity;

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;

    public AuditLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(AuditLogEntry entry, CancellationToken ct = default)
    {
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = entry.UserId,
            UserEmail = entry.UserEmail,
            Action = entry.Action,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            OldValues = entry.OldValues,
            NewValues = entry.NewValues,
            IpAddress = entry.IpAddress,
            Succeeded = entry.Succeeded,
            ErrorMessage = entry.ErrorMessage,
        });
        await _context.SaveChangesAsync(ct);
    }

    public async Task<PaginatedList<AuditLogDto>> GetLogsAsync(AuditLogQuery query, CancellationToken ct = default)
    {
        var q = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(a =>
                a.UserEmail.ToLower().Contains(s) ||
                a.Action.ToLower().Contains(s) ||
                a.EntityType.ToLower().Contains(s));
        }

        if (query.From.HasValue) q = q.Where(a => a.CreatedAt >= query.From.Value);
        if (query.To.HasValue)   q = q.Where(a => a.CreatedAt <= query.To.Value);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(a => a.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserEmail = a.UserEmail,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                IpAddress = a.IpAddress,
                Succeeded = a.Succeeded,
                ErrorMessage = a.ErrorMessage,
                CreatedAt = a.CreatedAt,
            })
            .ToListAsync(ct);

        return new PaginatedList<AuditLogDto>(items, total, query.PageNumber, query.PageSize);
    }
}
