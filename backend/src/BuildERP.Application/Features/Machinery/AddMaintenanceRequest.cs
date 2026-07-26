using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Machinery;
public class AddMaintenanceRequest
{
    public DateTime MaintenanceDate { get; set; } = DateTime.UtcNow;
    public MaintenanceType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public decimal? RunningHoursAtService { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? ServiceProvider { get; set; }
}
