using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Customers;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _db;
    public CustomerService(ApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<CustomerDto>> GetAllAsync(CustomerQuery query, CancellationToken ct = default)
    {
        var q = _db.Customers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(c => c.Name.ToLower().Contains(s) ||
                             (c.CompanyName != null && c.CompanyName.ToLower().Contains(s)) ||
                             (c.Phone != null && c.Phone.Contains(s)));
        }
        if (query.IsActive.HasValue) q = q.Where(c => c.IsActive == query.IsActive.Value);
        q = q.OrderByDescending(c => c.CreatedAt);
        var totalCount = await q.CountAsync(ct);
        var items = await q.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return new PaginatedList<CustomerDto>(items.Select(MapToDto).ToList(), totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<CustomerDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Customers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Customer {id} not found.");
        return MapToDto(entity);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerRequest request, CancellationToken ct = default)
    {
        var entity = new Customer
        {
            Name = request.Name, CompanyName = request.CompanyName, Phone = request.Phone,
            Email = request.Email, Address = request.Address, NTN = request.NTN,
            CNIC = request.CNIC, ProjectName = request.ProjectName,
            TotalBilled = request.TotalBilled, TotalPaid = request.TotalPaid,
            IsActive = request.IsActive, Notes = request.Notes
        };
        _db.Customers.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Customers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Customer {id} not found.");
        entity.Name = request.Name; entity.CompanyName = request.CompanyName; entity.Phone = request.Phone;
        entity.Email = request.Email; entity.Address = request.Address; entity.NTN = request.NTN;
        entity.CNIC = request.CNIC; entity.ProjectName = request.ProjectName;
        entity.TotalBilled = request.TotalBilled; entity.TotalPaid = request.TotalPaid;
        entity.IsActive = request.IsActive; entity.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Customers.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Customer {id} not found.");
        _db.Customers.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

    private static CustomerDto MapToDto(Customer c) => new()
    {
        Id = c.Id, Name = c.Name, CompanyName = c.CompanyName, Phone = c.Phone,
        Email = c.Email, Address = c.Address, NTN = c.NTN, CNIC = c.CNIC,
        ProjectName = c.ProjectName, TotalBilled = c.TotalBilled, TotalPaid = c.TotalPaid,
        OutstandingBalance = c.TotalBilled - c.TotalPaid,
        IsActive = c.IsActive, Notes = c.Notes, CreatedAt = c.CreatedAt
    };
}
