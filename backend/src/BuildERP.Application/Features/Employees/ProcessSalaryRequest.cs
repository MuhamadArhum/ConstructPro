namespace BuildERP.Application.Features.Employees;
public class ProcessSalaryRequest
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal Bonus { get; set; }
    public decimal Deductions { get; set; }
    public int DaysPresent { get; set; }
    public int TotalDays { get; set; }
    public string? Remarks { get; set; }
}
