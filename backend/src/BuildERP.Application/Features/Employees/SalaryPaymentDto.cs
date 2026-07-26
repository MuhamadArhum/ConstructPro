namespace BuildERP.Application.Features.Employees;
public class SalaryPaymentDto
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal Bonus { get; set; }
    public decimal Deductions { get; set; }
    public decimal NetSalary { get; set; }
    public int DaysPresent { get; set; }
    public int TotalDays { get; set; }
    public DateTime PaidAt { get; set; }
    public string? Remarks { get; set; }
}
