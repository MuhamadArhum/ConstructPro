import { baseApi } from '../../api/baseApi';
import type { PurchaseOrder, CreatePurchaseOrderDto } from '../../types/purchase-order.types';

export const purchaseOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<{ data: PurchaseOrder[]; total: number }, { page?: number; pageSize?: number; status?: string; supplierId?: string }>({
      query: (params) => ({ url: '/purchase-orders', params }),
      providesTags: [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
    getPurchaseOrder: builder.query<PurchaseOrder, string>({
      query: (id) => ({ url: `/purchase-orders/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'PurchaseOrder' as const, id }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrderDto>({
      query: (data) => ({ url: '/purchase-orders', method: 'POST', data }),
      invalidatesTags: [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; data: Partial<CreatePurchaseOrderDto> }>({
      query: ({ id, data }) => ({ url: `/purchase-orders/${id}`, method: 'PATCH', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'PurchaseOrder', id: 'LIST' }, { type: 'PurchaseOrder' as const, id }],
    }),
    updatePurchaseOrderStatus: builder.mutation<PurchaseOrder, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/purchase-orders/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'PurchaseOrder', id: 'LIST' }, { type: 'PurchaseOrder' as const, id }, 'Supplier'],
    }),
    deletePurchaseOrder: builder.mutation<void, string>({
      query: (id) => ({ url: `/purchase-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useDeletePurchaseOrderMutation,
} = purchaseOrderApi;
