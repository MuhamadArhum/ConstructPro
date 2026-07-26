using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class MachineryMaintenance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MachineryId { get; set; }
    public Machinery Machinery { get; set; } = null!;
    public DateTime MaintenanceDate { get; set; }
    public MaintenanceType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public decimal? RunningHoursAtService { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? ServiceProvider { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
