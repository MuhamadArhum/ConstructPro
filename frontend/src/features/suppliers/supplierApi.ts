import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { SupplierDto, CreateSupplierRequest, UpdateSupplierRequest, SupplierQuery } from '../../types/supplier.types';

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
  }),
});

export const { useGetSuppliersQuery, useGetSupplierByIdQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation } = supplierApi;
