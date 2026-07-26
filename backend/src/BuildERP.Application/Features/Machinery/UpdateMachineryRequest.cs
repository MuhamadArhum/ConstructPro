using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Machinery;
public class UpdateMachineryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public MachineryStatus Status { get; set; }
    public decimal TotalRunningHours { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Notes { get; set; }
}
