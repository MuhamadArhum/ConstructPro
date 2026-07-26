namespace BuildERP.Domain.Entities;
public class LabourAdvance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LabourId { get; set; }
    public Labour Labour { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Reason { get; set; }
}
