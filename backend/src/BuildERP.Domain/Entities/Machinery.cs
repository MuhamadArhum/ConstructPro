using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class Machinery
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public MachineryStatus Status { get; set; } = MachineryStatus.Active;
    public decimal TotalRunningHours { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<MachineryMaintenance> MaintenanceRecords { get; set; } = new List<MachineryMaintenance>();
}
