using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Machinery;
public class MachineryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public MachineryStatus Status { get; set; }
    public string StatusDisplay { get; set; } = string.Empty;
    public decimal TotalRunningHours { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public bool IsMaintenanceDue { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
