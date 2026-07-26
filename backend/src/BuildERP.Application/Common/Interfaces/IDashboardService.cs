using BuildERP.Application.Features.Dashboard;
namespace BuildERP.Application.Common.Interfaces;
public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default);
}
