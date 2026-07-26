namespace BuildERP.Application.Features.Labour;
public class UpdateLabourRequest
{
    public string Name { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? CNIC { get; set; }
    public string? Address { get; set; }
    public string? Trade { get; set; }
    public decimal DailyWage { get; set; }
    public decimal OvertimeRatePerHour { get; set; }
    public DateTime JoinDate { get; set; }
}
