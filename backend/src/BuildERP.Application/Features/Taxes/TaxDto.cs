using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Taxes;
public class TaxRecordDto
{
    public Guid Id { get; set; }
    public TaxType TaxType { get; set; }
    public string TaxTypeDisplay { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public bool IsPaid { get; set; }
    public string? Reference { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class TaxSummaryDto
{
    public decimal TotalTax { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalPending { get; set; }
    public int OverdueCount { get; set; }
}
public class CreateTaxRecordRequest
{
    public TaxType TaxType { get; set; }
    public decimal Amount { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public bool IsPaid { get; set; }
    public string? Reference { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
}
public class UpdateTaxRecordRequest : CreateTaxRecordRequest { }
public class TaxQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? TaxType { get; set; }
    public bool? IsPaid { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
