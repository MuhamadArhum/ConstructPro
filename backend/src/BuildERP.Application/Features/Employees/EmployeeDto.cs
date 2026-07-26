namespace BuildERP.Application.Features.Employees;
public class EmployeeDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Department { get; set; }
    public string? PhoneNumber { get; set; }
    public string? CNIC { get; set; }
    public decimal BasicSalary { get; set; }
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; }
}
