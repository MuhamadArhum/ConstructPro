using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Accounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _service;
    public AccountsController(IAccountService service) => _service = service;

    [HttpGet("chart")]
    public async Task<IActionResult> GetAccounts([FromQuery] AccountQuery query, CancellationToken ct)
        => Ok(await _service.GetAccountsAsync(query, ct));

    [HttpGet("chart/{id:guid}")]
    public async Task<IActionResult> GetAccount(Guid id, CancellationToken ct)
    {
        try { return Ok(await _service.GetAccountByIdAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("chart")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateChartOfAccountRequest request, CancellationToken ct)
    {
        var result = await _service.CreateAccountAsync(request, ct);
        return CreatedAtAction(nameof(GetAccount), new { id = result.Id }, result);
    }

    [HttpPut("chart/{id:guid}")]
    public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] UpdateChartOfAccountRequest request, CancellationToken ct)
    {
        try { return Ok(await _service.UpdateAccountAsync(id, request, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("chart/{id:guid}")]
    public async Task<IActionResult> DeleteAccount(Guid id, CancellationToken ct)
    {
        try { await _service.DeleteAccountAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpGet("journal")]
    public async Task<IActionResult> GetJournalEntries([FromQuery] JournalEntryQuery query, CancellationToken ct)
        => Ok(await _service.GetJournalEntriesAsync(query, ct));

    [HttpGet("journal/{id:guid}")]
    public async Task<IActionResult> GetJournalEntry(Guid id, CancellationToken ct)
    {
        try { return Ok(await _service.GetJournalEntryByIdAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("journal")]
    public async Task<IActionResult> CreateJournalEntry([FromBody] CreateJournalEntryRequest request, CancellationToken ct)
    {
        var result = await _service.CreateJournalEntryAsync(request, ct);
        return CreatedAtAction(nameof(GetJournalEntry), new { id = result.Id }, result);
    }

    [HttpDelete("journal/{id:guid}")]
    public async Task<IActionResult> DeleteJournalEntry(Guid id, CancellationToken ct)
    {
        try { await _service.DeleteJournalEntryAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
