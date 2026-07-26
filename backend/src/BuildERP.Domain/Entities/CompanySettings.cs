namespace BuildERP.Domain.Entities;
public class CompanySettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CompanyName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? NTN { get; set; }
    public string? STRN { get; set; }
    public string? LogoPath { get; set; }
    public string? Currency { get; set; } = "PKR";
    public string? FinancialYearStart { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
