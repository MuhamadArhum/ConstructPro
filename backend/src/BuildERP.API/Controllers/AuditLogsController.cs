using BuildERP.API.Authorization;
using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.AuditLogs;
using BuildERP.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [HasPermission(Permissions.AuditLogsView)]
    public async Task<IActionResult> GetLogs([FromQuery] AuditLogQuery query, CancellationToken ct)
    {
        var logs = await _auditLogService.GetLogsAsync(query, ct);
        return Ok(logs);
    }
}
