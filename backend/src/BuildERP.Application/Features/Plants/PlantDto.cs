using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Plants;
public class PlantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Manufacturer { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? CurrentValue { get; set; }
    public PlantStatus Status { get; set; }
    public string StatusDisplay { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class CreatePlantRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Manufacturer { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? CurrentValue { get; set; }
    public PlantStatus Status { get; set; } = PlantStatus.Active;
    public string? Location { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Notes { get; set; }
}
public class UpdatePlantRequest : CreatePlantRequest { }
public class PlantQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Status { get; set; }
}
