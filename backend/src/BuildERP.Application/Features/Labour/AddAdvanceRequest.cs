namespace BuildERP.Application.Features.Labour;
public class AddAdvanceRequest
{
    public decimal Amount { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? Reason { get; set; }
}
