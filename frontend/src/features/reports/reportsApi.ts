import { baseApi } from '../../api/baseApi';
import type { IncomeExpenseReportDto, LabourReportDto, InventoryReportDto, TaxReportDto, ReportQuery } from '../../types/reports.types';

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
  }),
});

export const {
  useGetIncomeExpenseReportQuery, useGetLabourReportQuery,
  useGetInventoryReportQuery, useGetTaxReportQuery,
} = reportsApi;
