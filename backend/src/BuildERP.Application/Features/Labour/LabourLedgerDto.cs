namespace BuildERP.Application.Features.Labour;
public class LabourLedgerDto
{
    public LabourDto Labour { get; set; } = null!;
    public decimal TotalEarnings { get; set; }
    public decimal TotalAdvances { get; set; }
    public decimal NetPayable { get; set; }
    public List<LabourAttendanceDto> Attendances { get; set; } = new();
    public List<LabourAdvanceDto> Advances { get; set; } = new();
}
