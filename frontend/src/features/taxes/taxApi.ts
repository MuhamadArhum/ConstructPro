import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { TaxRecordDto, TaxSummaryDto, CreateTaxRecordRequest, UpdateTaxRecordRequest, TaxQuery } from '../../types/tax.types';

export const taxApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxRecords: builder.query<PaginatedList<TaxRecordDto>, TaxQuery>({
      query: (params) => ({ url: '/tax', params }),
      providesTags: ['Tax'],
    }),
    getTaxRecordById: builder.query<TaxRecordDto, string>({
      query: (id) => ({ url: `/tax/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Tax' as const, id }],
    }),
    getTaxSummary: builder.query<TaxSummaryDto, void>({
      query: () => ({ url: '/tax/summary' }),
      providesTags: ['Tax'],
    }),
    createTaxRecord: builder.mutation<TaxRecordDto, CreateTaxRecordRequest>({
      query: (data) => ({ url: '/tax', method: 'POST', data }),
      invalidatesTags: ['Tax'],
    }),
    updateTaxRecord: builder.mutation<TaxRecordDto, { id: string; data: UpdateTaxRecordRequest }>({
      query: ({ id, data }) => ({ url: `/tax/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Tax'],
    }),
    deleteTaxRecord: builder.mutation<void, string>({
      query: (id) => ({ url: `/tax/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tax'],
    }),
    getNextTaxCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/tax/next-code' }),
    }),
  }),
});

export const {
  useGetTaxRecordsQuery, useGetTaxRecordByIdQuery, useGetTaxSummaryQuery,
  useCreateTaxRecordMutation, useUpdateTaxRecordMutation, useDeleteTaxRecordMutation,
  useGetNextTaxCodeQuery,
} = taxApi;
