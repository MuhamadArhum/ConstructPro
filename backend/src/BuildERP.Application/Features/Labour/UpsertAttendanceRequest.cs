namespace BuildERP.Application.Features.Labour;
public class UpsertAttendanceRequest
{
    public Guid LabourId { get; set; }
    public DateTime Date { get; set; }
    public bool IsPresent { get; set; }
    public decimal OvertimeHours { get; set; }
    public string? Notes { get; set; }
}
