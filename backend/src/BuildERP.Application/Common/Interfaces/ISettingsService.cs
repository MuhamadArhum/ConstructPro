using BuildERP.Application.Features.Settings;
namespace BuildERP.Application.Common.Interfaces;
public interface ISettingsService
{
    Task<CompanySettingsDto> GetAsync(CancellationToken ct = default);
    Task<CompanySettingsDto> UpdateAsync(UpdateCompanySettingsRequest request, CancellationToken ct = default);
}
