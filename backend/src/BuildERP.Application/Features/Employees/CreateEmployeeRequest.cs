namespace BuildERP.Application.Features.Employees;
public class CreateEmployeeRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Department { get; set; }
    public string? PhoneNumber { get; set; }
    public string? CNIC { get; set; }
    public string? Address { get; set; }
    public decimal BasicSalary { get; set; }
    public DateTime JoinDate { get; set; } = DateTime.UtcNow;
}
