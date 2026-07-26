namespace BuildERP.Application.Features.Settings;
public class CompanySettingsDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? NTN { get; set; }
    public string? STRN { get; set; }
    public string? LogoPath { get; set; }
    public string? Currency { get; set; }
    public string? FinancialYearStart { get; set; }
    public DateTime UpdatedAt { get; set; }
}
public class UpdateCompanySettingsRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? NTN { get; set; }
    public string? STRN { get; set; }
    public string? Currency { get; set; }
    public string? FinancialYearStart { get; set; }
}
