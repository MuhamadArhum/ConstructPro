using BuildERP.Domain.Enums;
namespace BuildERP.Application.Features.Income;
public class CreateIncomeRequest
{
    public IncomeCategory Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? ProjectName { get; set; }
    public bool IsPaid { get; set; } = true;
}
