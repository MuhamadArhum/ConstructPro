using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Common.Models;
using BuildERP.Application.Features.Employees;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _db;

    public EmployeeService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedList<EmployeeDto>> GetAllAsync(int page, int pageSize, string? search, string? department, bool? isActive, CancellationToken ct = default)
    {
        var q = _db.Employees.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            q = q.Where(e =>
                e.FullName.ToLower().Contains(s) ||
                (e.CNIC != null && e.CNIC.ToLower().Contains(s)) ||
                (e.Department != null && e.Department.ToLower().Contains(s)) ||
                (e.Designation != null && e.Designation.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(department))
            q = q.Where(e => e.Department != null && e.Department.ToLower().Contains(department.ToLower()));

        if (isActive.HasValue)
            q = q.Where(e => e.IsActive == isActive.Value);

        q = q.OrderBy(e => e.FullName);

        var totalCount = await q.CountAsync(ct);
        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedList<EmployeeDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<EmployeeDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Employees.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Employee {id} not found.");
        return MapToDto(entity);
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeRequest request, CancellationToken ct = default)
    {
        var entity = new Employee
        {
            FullName = request.FullName,
            Designation = request.Designation,
            Department = request.Department,
            PhoneNumber = request.PhoneNumber,
            CNIC = request.CNIC,
            Address = request.Address,
            BasicSalary = request.BasicSalary,
            JoinDate = request.JoinDate,
            IsActive = true
        };

        _db.Employees.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<EmployeeDto> UpdateAsync(Guid id, UpdateEmployeeRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Employees.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Employee {id} not found.");

        entity.FullName = request.FullName;
        entity.Designation = request.Designation;
        entity.Department = request.Department;
        entity.PhoneNumber = request.PhoneNumber;
        entity.CNIC = request.CNIC;
        entity.Address = request.Address;
        entity.BasicSalary = request.BasicSalary;
        entity.JoinDate = request.JoinDate;

        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Employees.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException($"Employee {id} not found.");
        entity.IsActive = false;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<SalaryPaymentDto> ProcessSalaryAsync(Guid employeeId, ProcessSalaryRequest request, CancellationToken ct = default)
    {
        var employee = await _db.Employees.FindAsync(new object[] { employeeId }, ct)
            ?? throw new KeyNotFoundException($"Employee {employeeId} not found.");

        decimal proRatedBasic = request.TotalDays > 0
            ? request.BasicSalary * request.DaysPresent / request.TotalDays
            : request.BasicSalary;

        var netSalary = proRatedBasic + request.Bonus - request.Deductions;

        var payment = new SalaryPayment
        {
            EmployeeId = employeeId,
            Month = request.Month,
            Year = request.Year,
            BasicSalary = request.BasicSalary,
            Bonus = request.Bonus,
            Deductions = request.Deductions,
            NetSalary = netSalary,
            DaysPresent = request.DaysPresent,
            TotalDays = request.TotalDays,
            Remarks = request.Remarks,
            PaidAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _db.SalaryPayments.Add(payment);
        await _db.SaveChangesAsync(ct);

        return MapSalaryDto(payment, employee.FullName);
    }

    public async Task<List<SalaryPaymentDto>> GetSalaryHistoryAsync(Guid employeeId, CancellationToken ct = default)
    {
        var employee = await _db.Employees.FindAsync(new object[] { employeeId }, ct)
            ?? throw new KeyNotFoundException($"Employee {employeeId} not found.");

        var payments = await _db.SalaryPayments
            .Where(p => p.EmployeeId == employeeId)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ToListAsync(ct);

        return payments.Select(p => MapSalaryDto(p, employee.FullName)).ToList();
    }

    public async Task<List<SalaryPaymentDto>> GetAllSalariesAsync(int month, int year, CancellationToken ct = default)
    {
        var payments = await _db.SalaryPayments
            .Include(p => p.Employee)
            .Where(p => p.Month == month && p.Year == year)
            .OrderBy(p => p.Employee.FullName)
            .ToListAsync(ct);

        return payments.Select(p => MapSalaryDto(p, p.Employee.FullName)).ToList();
    }

    private static EmployeeDto MapToDto(Employee e) => new()
    {
        Id = e.Id,
        FullName = e.FullName,
        Designation = e.Designation,
        Department = e.Department,
        PhoneNumber = e.PhoneNumber,
        CNIC = e.CNIC,
        BasicSalary = e.BasicSalary,
        JoinDate = e.JoinDate,
        IsActive = e.IsActive
    };

    private static SalaryPaymentDto MapSalaryDto(SalaryPayment p, string employeeName) => new()
    {
        Id = p.Id,
        EmployeeId = p.EmployeeId,
        EmployeeName = employeeName,
        Month = p.Month,
        Year = p.Year,
        BasicSalary = p.BasicSalary,
        Bonus = p.Bonus,
        Deductions = p.Deductions,
        NetSalary = p.NetSalary,
        DaysPresent = p.DaysPresent,
        TotalDays = p.TotalDays,
        PaidAt = p.PaidAt,
        Remarks = p.Remarks
    };
}
