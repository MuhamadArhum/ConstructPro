using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Vehicles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehicleController : ControllerBase
{
    private readonly IVehicleService _service;
    public VehicleController(IVehicleService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] VehicleQuery query, CancellationToken ct)
        => Ok(await _service.GetAllAsync(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try { return Ok(await _service.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVehicleRequest request, CancellationToken ct)
    {
        var result = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVehicleRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.UpdateAsync(id, request, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _service.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpGet("{id:guid}/maintenance")]
    public async Task<IActionResult> GetMaintenance(Guid id, CancellationToken ct)
        => Ok(await _service.GetMaintenanceAsync(id, ct));

    [HttpPost("{id:guid}/maintenance")]
    public async Task<IActionResult> AddMaintenance(Guid id, [FromBody] CreateVehicleMaintenanceRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.AddMaintenanceAsync(id, request, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
