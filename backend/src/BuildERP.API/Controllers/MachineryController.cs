using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Machinery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MachineryController : ControllerBase
{
    private readonly IMachineryService _machineryService;

    public MachineryController(IMachineryService machineryService)
    {
        _machineryService = machineryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        var result = await _machineryService.GetAllAsync(pageNumber, pageSize, search, status, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _machineryService.GetByIdAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMachineryRequest request, CancellationToken ct)
    {
        var result = await _machineryService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMachineryRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _machineryService.UpdateAsync(id, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await _machineryService.DeleteAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:guid}/maintenance")]
    public async Task<IActionResult> GetMaintenanceHistory(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _machineryService.GetMaintenanceHistoryAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:guid}/maintenance")]
    public async Task<IActionResult> AddMaintenance(Guid id, [FromBody] AddMaintenanceRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _machineryService.AddMaintenanceAsync(id, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("maintenance-due")]
    public async Task<IActionResult> GetDueForMaintenance(CancellationToken ct)
    {
        var result = await _machineryService.GetDueForMaintenanceAsync(ct);
        return Ok(result);
    }
}
