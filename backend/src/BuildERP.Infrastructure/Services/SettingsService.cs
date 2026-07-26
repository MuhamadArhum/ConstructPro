using BuildERP.Application.Common.Interfaces;
using BuildERP.Application.Features.Settings;
using BuildERP.Domain.Entities;
using BuildERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildERP.Infrastructure.Services;

public class SettingsService : ISettingsService
{
    private readonly ApplicationDbContext _db;
    public SettingsService(ApplicationDbContext db) => _db = db;

    public async Task<CompanySettingsDto> GetAsync(CancellationToken ct = default)
    {
        var settings = await _db.CompanySettings.FirstOrDefaultAsync(ct);
        if (settings == null)
        {
            settings = new CompanySettings { CompanyName = "ConstructPro", Currency = "PKR" };
            _db.CompanySettings.Add(settings);
            await _db.SaveChangesAsync(ct);
        }
        return MapToDto(settings);
    }

    public async Task<CompanySettingsDto> UpdateAsync(UpdateCompanySettingsRequest request, CancellationToken ct = default)
    {
        var settings = await _db.CompanySettings.FirstOrDefaultAsync(ct);
        if (settings == null)
        {
            settings = new CompanySettings();
            _db.CompanySettings.Add(settings);
        }
        settings.CompanyName = request.CompanyName;
        settings.Address = request.Address;
        settings.Phone = request.Phone;
        settings.Email = request.Email;
        settings.Website = request.Website;
        settings.NTN = request.NTN;
        settings.STRN = request.STRN;
        settings.Currency = request.Currency;
        settings.FinancialYearStart = request.FinancialYearStart;
        settings.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return MapToDto(settings);
    }

    private static CompanySettingsDto MapToDto(CompanySettings s) => new()
    {
        Id = s.Id, CompanyName = s.CompanyName, Address = s.Address,
        Phone = s.Phone, Email = s.Email, Website = s.Website,
        NTN = s.NTN, STRN = s.STRN, LogoPath = s.LogoPath,
        Currency = s.Currency, FinancialYearStart = s.FinancialYearStart, UpdatedAt = s.UpdatedAt
    };
}
