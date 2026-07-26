using BuildERP.Application.Features.Reports;
namespace BuildERP.Application.Common.Interfaces;
public interface IReportService
{
    Task<IncomeExpenseReportDto> GetIncomeExpenseReportAsync(ReportQuery query, CancellationToken ct = default);
    Task<LabourReportDto> GetLabourReportAsync(ReportQuery query, CancellationToken ct = default);
    Task<InventoryReportDto> GetInventoryReportAsync(CancellationToken ct = default);
    Task<TaxReportDto> GetTaxReportAsync(ReportQuery query, CancellationToken ct = default);
}
