namespace BuildERP.Application.Features.Labour;
public class LabourAdvanceDto
{
    public Guid Id { get; set; }
    public Guid LabourId { get; set; }
    public string LabourName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Reason { get; set; }
}
