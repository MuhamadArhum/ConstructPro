namespace BuildERP.Domain.Entities;
public class LabourAttendance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LabourId { get; set; }
    public Labour Labour { get; set; } = null!;
    public DateTime Date { get; set; }
    public bool IsPresent { get; set; }
    public decimal OvertimeHours { get; set; }
    public string? Notes { get; set; }
}
