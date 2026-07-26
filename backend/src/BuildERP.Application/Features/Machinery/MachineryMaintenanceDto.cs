using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Machinery;
public class MachineryMaintenanceDto
{
    public Guid Id { get; set; }
    public Guid MachineryId { get; set; }
    public string MachineryName { get; set; } = string.Empty;
    public DateTime MaintenanceDate { get; set; }
    public MaintenanceType Type { get; set; }
    public string TypeDisplay { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public decimal? RunningHoursAtService { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? ServiceProvider { get; set; }
    public DateTime CreatedAt { get; set; }
}
