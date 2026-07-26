using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;
    public ReportsController(IReportService service) => _service = service;

    [HttpGet("income-expense")]
    public async Task<IActionResult> GetIncomeExpense([FromQuery] ReportQuery query, CancellationToken ct)
        => Ok(await _service.GetIncomeExpenseReportAsync(query, ct));

    [HttpGet("labour")]
    public async Task<IActionResult> GetLabour([FromQuery] ReportQuery query, CancellationToken ct)
        => Ok(await _service.GetLabourReportAsync(query, ct));

    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventory(CancellationToken ct)
        => Ok(await _service.GetInventoryReportAsync(ct));

    [HttpGet("tax")]
    public async Task<IActionResult> GetTax([FromQuery] ReportQuery query, CancellationToken ct)
        => Ok(await _service.GetTaxReportAsync(query, ct));
}
