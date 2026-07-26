using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class Vehicle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RegistrationNumber { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? DriverName { get; set; }
    public string? DriverContact { get; set; }
    public decimal? PurchasePrice { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public VehicleStatus Status { get; set; } = VehicleStatus.Active;
    public decimal TotalMileage { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<VehicleMaintenance> MaintenanceRecords { get; set; } = new List<VehicleMaintenance>();
}
