namespace BuildERP.Domain.Entities;
public class Labour
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? CNIC { get; set; }
    public string? Address { get; set; }
    public string? Trade { get; set; }
    public decimal DailyWage { get; set; }
    public decimal OvertimeRatePerHour { get; set; }
    public DateTime JoinDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public ICollection<LabourAttendance> Attendances { get; set; } = new List<LabourAttendance>();
    public ICollection<LabourAdvance> Advances { get; set; } = new List<LabourAdvance>();
}
