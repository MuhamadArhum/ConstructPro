using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Inventory;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _db;
    public InventoryService(ApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<InventoryItemDto>> GetAllAsync(InventoryQuery query, CancellationToken ct = default)
    {
        var q = _db.InventoryItems.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(i => i.Name.ToLower().Contains(s) ||
                             (i.Category != null && i.Category.ToLower().Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(query.Category))
            q = q.Where(i => i.Category == query.Category);
        if (query.LowStock == true)
            q = q.Where(i => i.CurrentStock <= i.LowStockThreshold);

        q = q.OrderBy(i => i.Name);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<InventoryItemDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<InventoryItemDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.InventoryItems.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Item {id} not found.");
        return MapToDto(entity);
    }

    public async Task<InventoryItemDto> CreateAsync(CreateInventoryItemRequest request, CancellationToken ct = default)
    {
        var entity = new InventoryItem
        {
            Name = request.Name, Category = request.Category, Unit = request.Unit,
            CurrentStock = request.CurrentStock, LowStockThreshold = request.LowStockThreshold,
            UnitPrice = request.UnitPrice, SupplierName = request.SupplierName,
            Location = request.Location, Notes = request.Notes
        };
        _db.InventoryItems.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<InventoryItemDto> UpdateAsync(Guid id, UpdateInventoryItemRequest request, CancellationToken ct = default)
    {
        var entity = await _db.InventoryItems.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Item {id} not found.");
        entity.Name = request.Name; entity.Category = request.Category; entity.Unit = request.Unit;
        entity.LowStockThreshold = request.LowStockThreshold; entity.UnitPrice = request.UnitPrice;
        entity.SupplierName = request.SupplierName; entity.Location = request.Location; entity.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.InventoryItems.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Item {id} not found.");
        _db.InventoryItems.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<StockTransactionDto>> GetTransactionsAsync(Guid itemId, CancellationToken ct = default)
    {
        var txns = await _db.StockTransactions
            .Include(t => t.InventoryItem)
            .Where(t => t.InventoryItemId == itemId)
            .OrderByDescending(t => t.Date)
            .ToListAsync(ct);
        return txns.Select(MapTxnToDto).ToList();
    }

    public async Task<StockTransactionDto> AddTransactionAsync(Guid itemId, AddStockTransactionRequest request, CancellationToken ct = default)
    {
        var item = await _db.InventoryItems.FindAsync(new object[] { itemId }, ct)
            ?? throw new KeyNotFoundException($"Item {itemId} not found.");

        var txn = new StockTransaction
        {
            InventoryItemId = itemId,
            Type = request.Type,
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            Date = request.Date,
            Reference = request.Reference,
            ProjectName = request.ProjectName,
            Notes = request.Notes
        };

        if (request.Type == StockTransactionType.StockIn)
            item.CurrentStock += request.Quantity;
        else
            item.CurrentStock -= request.Quantity;

        _db.StockTransactions.Add(txn);
        await _db.SaveChangesAsync(ct);
        txn.InventoryItem = item;
        return MapTxnToDto(txn);
    }

    private static InventoryItemDto MapToDto(InventoryItem i) => new()
    {
        Id = i.Id, Name = i.Name, Category = i.Category, Unit = i.Unit,
        CurrentStock = i.CurrentStock, LowStockThreshold = i.LowStockThreshold,
        UnitPrice = i.UnitPrice, SupplierName = i.SupplierName, Location = i.Location,
        IsLowStock = i.CurrentStock <= i.LowStockThreshold,
        Notes = i.Notes, CreatedAt = i.CreatedAt
    };

    private static StockTransactionDto MapTxnToDto(StockTransaction t) => new()
    {
        Id = t.Id, InventoryItemId = t.InventoryItemId,
        ItemName = t.InventoryItem?.Name ?? string.Empty,
        Type = t.Type, TypeDisplay = t.Type.ToString(),
        Quantity = t.Quantity, UnitPrice = t.UnitPrice, Date = t.Date,
        Reference = t.Reference, ProjectName = t.ProjectName, Notes = t.Notes, CreatedAt = t.CreatedAt
    };
}
