using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Accounts;
namespace BuildERP.Application.Common.Interfaces;
public interface IAccountService
{
    Task<PaginatedList<ChartOfAccountDto>> GetAccountsAsync(AccountQuery query, CancellationToken ct = default);
    Task<ChartOfAccountDto> GetAccountByIdAsync(Guid id, CancellationToken ct = default);
    Task<ChartOfAccountDto> CreateAccountAsync(CreateChartOfAccountRequest request, CancellationToken ct = default);
    Task<ChartOfAccountDto> UpdateAccountAsync(Guid id, UpdateChartOfAccountRequest request, CancellationToken ct = default);
    Task DeleteAccountAsync(Guid id, CancellationToken ct = default);
    Task<PaginatedList<JournalEntryDto>> GetJournalEntriesAsync(JournalEntryQuery query, CancellationToken ct = default);
    Task<JournalEntryDto> GetJournalEntryByIdAsync(Guid id, CancellationToken ct = default);
    Task<JournalEntryDto> CreateJournalEntryAsync(CreateJournalEntryRequest request, CancellationToken ct = default);
    Task DeleteJournalEntryAsync(Guid id, CancellationToken ct = default);
}
