namespace BuildERP.Application.Features.Labour;
public class LabourAttendanceDto
{
    public Guid Id { get; set; }
    public Guid LabourId { get; set; }
    public string LabourName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public bool IsPresent { get; set; }
    public decimal OvertimeHours { get; set; }
    public string? Notes { get; set; }
    public decimal DailyWage { get; set; }
    public decimal OvertimePay { get; set; }
    public decimal TotalPay { get; set; }
}
