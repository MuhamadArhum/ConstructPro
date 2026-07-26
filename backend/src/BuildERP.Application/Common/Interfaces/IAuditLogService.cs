using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.AuditLogs;

namespace BuildERP.Application.Common.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(AuditLogEntry entry, CancellationToken ct = default);
    Task<PaginatedList<AuditLogDto>> GetLogsAsync(AuditLogQuery query, CancellationToken ct = default);
}
