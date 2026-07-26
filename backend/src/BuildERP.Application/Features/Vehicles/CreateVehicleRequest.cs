using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Vehicles;
public class CreateVehicleRequest
{
    public string RegistrationNumber { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? DriverName { get; set; }
    public string? DriverContact { get; set; }
    public decimal? PurchasePrice { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public VehicleStatus Status { get; set; } = VehicleStatus.Active;
    public string? Notes { get; set; }
}
public class UpdateVehicleRequest : CreateVehicleRequest
{
    public decimal TotalMileage { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
}
public class CreateVehicleMaintenanceRequest
{
    public DateTime MaintenanceDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string? ServiceProvider { get; set; }
    public DateTime? NextDueDate { get; set; }
    public decimal? MileageAtService { get; set; }
    public string? Notes { get; set; }
}
public class VehicleQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Status { get; set; }
}
