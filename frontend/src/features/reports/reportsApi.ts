import { baseApi } from '../../api/baseApi';
import type {
  IncomeExpenseReportDto,
  LabourReportDto,
  InventoryReportDto,
  TaxReportDto,
  CustomerReportDto,
  SupplierReportDto,
  EmployeeReportDto,
  MachineryReportDto,
  VehicleReportDto,
  ReportQuery,
} from '../../types/reports.types';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeExpenseReport: builder.query<IncomeExpenseReportDto, ReportQuery>({
      query: (params) => ({ url: '/reports/income-expense', params }),
      providesTags: ['Income', 'Expense'],
    }),
    getLabourReport: builder.query<LabourReportDto, ReportQuery>({
      query: (params) => ({ url: '/reports/labour', params }),
      providesTags: ['Labour'],
    }),
    getInventoryReport: builder.query<InventoryReportDto, void>({
      query: () => ({ url: '/reports/inventory' }),
      providesTags: ['Inventory'],
    }),
    getTaxReport: builder.query<TaxReportDto, ReportQuery>({
      query: (params) => ({ url: '/reports/tax', params }),
      providesTags: ['Tax'],
    }),
    getCustomerReport: builder.query<CustomerReportDto, void>({
      query: () => ({ url: '/reports/customers' }),
      providesTags: ['Customer'],
    }),
    getSupplierReport: builder.query<SupplierReportDto, void>({
      query: () => ({ url: '/reports/suppliers' }),
      providesTags: ['Supplier'],
    }),
    getEmployeeReport: builder.query<EmployeeReportDto, void>({
      query: () => ({ url: '/reports/employees' }),
      providesTags: ['Employee'],
    }),
    getMachineryReport: builder.query<MachineryReportDto, ReportQuery>({
      query: (params) => ({ url: '/reports/machinery', params }),
      providesTags: ['Machinery'],
    }),
    getVehicleReport: builder.query<VehicleReportDto, ReportQuery>({
      query: (params) => ({ url: '/reports/vehicles', params }),
      providesTags: ['Vehicle'],
    }),
  }),
});

export const {
  useGetIncomeExpenseReportQuery,
  useGetLabourReportQuery,
  useGetInventoryReportQuery,
  useGetTaxReportQuery,
  useGetCustomerReportQuery,
  useGetSupplierReportQuery,
  useGetEmployeeReportQuery,
  useGetMachineryReportQuery,
  useGetVehicleReportQuery,
} = reportsApi;
