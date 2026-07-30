import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { SupplierDto, CreateSupplierRequest, UpdateSupplierRequest, SupplierQuery, SupplierLedgerResponse, CreateSupplierTransactionRequest } from '../../types/supplier.types';

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<PaginatedList<SupplierDto>, SupplierQuery>({
      query: (params) => ({ url: '/supplier', params }),
      providesTags: ['Supplier'],
    }),
    getSupplierById: builder.query<SupplierDto, string>({
      query: (id) => ({ url: `/supplier/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Supplier' as const, id }],
    }),
    createSupplier: builder.mutation<SupplierDto, CreateSupplierRequest>({
      query: (data) => ({ url: '/supplier', method: 'POST', data }),
      invalidatesTags: ['Supplier'],
    }),
    updateSupplier: builder.mutation<SupplierDto, { id: string; data: UpdateSupplierRequest }>({
      query: ({ id, data }) => ({ url: `/supplier/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Supplier'],
    }),
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({ url: `/supplier/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Supplier'],
    }),
    getSupplierLedger: builder.query<SupplierLedgerResponse, { id: string; fromDate?: string; toDate?: string }>({
      query: ({ id, fromDate, toDate }) => ({ url: `/supplier/${id}/ledger`, params: { fromDate, toDate } }),
      providesTags: (_r, _e, { id }) => [{ type: 'Supplier' as const, id: `ledger-${id}` }],
    }),
    addSupplierTransaction: builder.mutation<void, { id: string; data: CreateSupplierTransactionRequest }>({
      query: ({ id, data }) => ({ url: `/supplier/${id}/transactions`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => ['Supplier', { type: 'Supplier' as const, id: `ledger-${id}` }],
    }),
    deleteSupplierTransaction: builder.mutation<void, { supplierId: string; txId: string }>({
      query: ({ supplierId, txId }) => ({ url: `/supplier/${supplierId}/transactions/${txId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { supplierId }) => ['Supplier', { type: 'Supplier' as const, id: `ledger-${supplierId}` }],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierLedgerQuery,
  useAddSupplierTransactionMutation,
  useDeleteSupplierTransactionMutation,
} = supplierApi;
