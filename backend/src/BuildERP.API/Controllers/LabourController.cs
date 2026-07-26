using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Labour;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LabourController : ControllerBase
{
    private readonly ILabourService _labourService;

    public LabourController(ILabourService labourService)
    {
        _labourService = labourService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? trade = null,
        [FromQuery] bool? isActive = null,
        CancellationToken ct = default)
    {
        var result = await _labourService.GetAllAsync(pageNumber, pageSize, search, trade, isActive, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _labourService.GetByIdAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLabourRequest request, CancellationToken ct)
    {
        var result = await _labourService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLabourRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _labourService.UpdateAsync(id, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        try
        {
            await _labourService.DeactivateAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:guid}/attendance")]
    public async Task<IActionResult> GetAttendance(
        Guid id,
        [FromQuery] int month,
        [FromQuery] int year,
        CancellationToken ct)
    {
        try
        {
            var result = await _labourService.GetAttendanceAsync(id, month, year, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("attendance")]
    public async Task<IActionResult> UpsertAttendance([FromBody] UpsertAttendanceRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _labourService.UpsertAttendanceAsync(request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:guid}/advances")]
    public async Task<IActionResult> GetAdvances(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _labourService.GetAdvancesAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:guid}/advances")]
    public async Task<IActionResult> AddAdvance(Guid id, [FromBody] AddAdvanceRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _labourService.AddAdvanceAsync(id, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:guid}/ledger")]
    public async Task<IActionResult> GetLedger(
        Guid id,
        [FromQuery] int month,
        [FromQuery] int year,
        CancellationToken ct)
    {
        try
        {
            var result = await _labourService.GetLedgerAsync(id, month, year, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
