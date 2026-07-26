namespace BuildERP.Application.Features.Labour;
public class LabourDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? CNIC { get; set; }
    public string? Trade { get; set; }
    public decimal DailyWage { get; set; }
    public decimal OvertimeRatePerHour { get; set; }
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; }
    public decimal TotalAdvances { get; set; }
}
