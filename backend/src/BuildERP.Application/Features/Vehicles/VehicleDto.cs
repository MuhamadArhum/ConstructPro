using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Vehicles;
public class VehicleDto
{
    public Guid Id { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? DriverName { get; set; }
    public string? DriverContact { get; set; }
    public decimal? PurchasePrice { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public VehicleStatus Status { get; set; }
    public string StatusDisplay { get; set; } = string.Empty;
    public decimal TotalMileage { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int MaintenanceCount { get; set; }
}
public class VehicleMaintenanceDto
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public DateTime MaintenanceDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string? ServiceProvider { get; set; }
    public DateTime? NextDueDate { get; set; }
    public decimal? MileageAtService { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
