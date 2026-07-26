using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Accounts;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class AccountService : IAccountService
{
    private readonly ApplicationDbContext _db;
    public AccountService(ApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<ChartOfAccountDto>> GetAccountsAsync(AccountQuery query, CancellationToken ct = default)
    {
        var q = _db.ChartOfAccounts.Include(a => a.Parent).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(a => a.Name.ToLower().Contains(s) || a.Code.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(query.AccountType) && Enum.TryParse<AccountType>(query.AccountType, true, out var at))
            q = q.Where(a => a.AccountType == at);
        if (query.IsActive.HasValue) q = q.Where(a => a.IsActive == query.IsActive.Value);

        q = q.OrderBy(a => a.Code);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);

        var dtos = new List<ChartOfAccountDto>();
        foreach (var item in items)
        {
            var balance = await GetAccountBalance(item.Id, ct);
            dtos.Add(MapAccountToDto(item, balance));
        }
        return new PaginatedList<ChartOfAccountDto>(dtos, totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<ChartOfAccountDto> GetAccountByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ChartOfAccounts.Include(a => a.Parent)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new KeyNotFoundException($"Account {id} not found.");
        var balance = await GetAccountBalance(id, ct);
        return MapAccountToDto(entity, balance);
    }

    public async Task<ChartOfAccountDto> CreateAccountAsync(CreateChartOfAccountRequest request, CancellationToken ct = default)
    {
        var entity = new ChartOfAccount
        {
            Code = request.Code, Name = request.Name, AccountType = request.AccountType,
            ParentId = request.ParentId, IsActive = request.IsActive, Description = request.Description
        };
        _db.ChartOfAccounts.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapAccountToDto(entity, 0);
    }

    public async Task<ChartOfAccountDto> UpdateAccountAsync(Guid id, UpdateChartOfAccountRequest request, CancellationToken ct = default)
    {
        var entity = await _db.ChartOfAccounts.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Account {id} not found.");
        entity.Code = request.Code; entity.Name = request.Name; entity.AccountType = request.AccountType;
        entity.ParentId = request.ParentId; entity.IsActive = request.IsActive; entity.Description = request.Description;
        await _db.SaveChangesAsync(ct);
        return MapAccountToDto(entity, await GetAccountBalance(id, ct));
    }

    public async Task DeleteAccountAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ChartOfAccounts.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Account {id} not found.");
        _db.ChartOfAccounts.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PaginatedList<JournalEntryDto>> GetJournalEntriesAsync(JournalEntryQuery query, CancellationToken ct = default)
    {
        var q = _db.JournalEntries.Include(j => j.Lines).ThenInclude(l => l.Account).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(j => j.Description.ToLower().Contains(s) ||
                             j.EntryNumber.ToLower().Contains(s) ||
                             (j.Reference != null && j.Reference.ToLower().Contains(s)));
        }
        if (query.FromDate.HasValue) q = q.Where(j => j.Date >= query.FromDate.Value);
        if (query.ToDate.HasValue) q = q.Where(j => j.Date <= query.ToDate.Value);
        if (query.IsPosted.HasValue) q = q.Where(j => j.IsPosted == query.IsPosted.Value);

        q = q.OrderByDescending(j => j.Date);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<JournalEntryDto>(items.Select(MapJournalToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<JournalEntryDto> GetJournalEntryByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.JournalEntries.Include(j => j.Lines).ThenInclude(l => l.Account)
            .FirstOrDefaultAsync(j => j.Id == id, ct)
            ?? throw new KeyNotFoundException($"JournalEntry {id} not found.");
        return MapJournalToDto(entity);
    }

    public async Task<JournalEntryDto> CreateJournalEntryAsync(CreateJournalEntryRequest request, CancellationToken ct = default)
    {
        var count = await _db.JournalEntries.CountAsync(ct);
        var entry = new JournalEntry
        {
            EntryNumber = $"JV-{(count + 1):D5}",
            Date = request.Date,
            Description = request.Description,
            Reference = request.Reference,
            Notes = request.Notes,
            TotalDebit = request.Lines.Sum(l => l.Debit),
            TotalCredit = request.Lines.Sum(l => l.Credit),
            IsPosted = true,
            Lines = request.Lines.Select(l => new JournalEntryLine
            {
                AccountId = l.AccountId, Debit = l.Debit, Credit = l.Credit, Description = l.Description
            }).ToList()
        };
        _db.JournalEntries.Add(entry);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(entry).Collection(e => e.Lines).Query().Include(l => l.Account).LoadAsync(ct);
        return MapJournalToDto(entry);
    }

    public async Task DeleteJournalEntryAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.JournalEntries.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"JournalEntry {id} not found.");
        _db.JournalEntries.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<decimal> GetAccountBalance(Guid accountId, CancellationToken ct)
    {
        var debit = await _db.JournalEntryLines.Where(l => l.AccountId == accountId).SumAsync(l => l.Debit, ct);
        var credit = await _db.JournalEntryLines.Where(l => l.AccountId == accountId).SumAsync(l => l.Credit, ct);
        return debit - credit;
    }

    private static ChartOfAccountDto MapAccountToDto(ChartOfAccount a, decimal balance) => new()
    {
        Id = a.Id, Code = a.Code, Name = a.Name, AccountType = a.AccountType,
        AccountTypeDisplay = a.AccountType.ToString(), ParentId = a.ParentId,
        ParentName = a.Parent?.Name, IsActive = a.IsActive, Description = a.Description,
        Balance = balance, CreatedAt = a.CreatedAt
    };

    private static JournalEntryDto MapJournalToDto(JournalEntry j) => new()
    {
        Id = j.Id, EntryNumber = j.EntryNumber, Date = j.Date, Description = j.Description,
        Reference = j.Reference, TotalDebit = j.TotalDebit, TotalCredit = j.TotalCredit,
        IsPosted = j.IsPosted, Notes = j.Notes, CreatedAt = j.CreatedAt,
        Lines = j.Lines.Select(l => new JournalEntryLineDto
        {
            Id = l.Id, AccountId = l.AccountId,
            AccountCode = l.Account?.Code ?? string.Empty,
            AccountName = l.Account?.Name ?? string.Empty,
            Debit = l.Debit, Credit = l.Credit, Description = l.Description
        }).ToList()
    };
}
