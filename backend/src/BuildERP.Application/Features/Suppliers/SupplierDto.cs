namespace BuildERP.Application.Features.Suppliers;
public class SupplierDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? NTN { get; set; }
    public string? Category { get; set; }
    public decimal TotalPurchased { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal OutstandingBalance { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class CreateSupplierRequest
{
    public string Name { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? NTN { get; set; }
    public string? Category { get; set; }
    public decimal TotalPurchased { get; set; }
    public decimal TotalPaid { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}
public class UpdateSupplierRequest : CreateSupplierRequest { }
public class SupplierQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public bool? IsActive { get; set; }
}
