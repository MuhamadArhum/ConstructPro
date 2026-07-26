namespace BuildERP.Application.Features.Income;
public class IncomeSummaryDto
{
    public decimal TotalAllTime { get; set; }
    public decimal TotalThisMonth { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalPending { get; set; }
}
