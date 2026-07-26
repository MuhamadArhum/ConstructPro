import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { InventoryItemDto, CreateInventoryItemRequest, UpdateInventoryItemRequest, InventoryQuery, StockTransactionDto, AddStockTransactionRequest } from '../../types/inventory.types';

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryItems: builder.query<PaginatedList<InventoryItemDto>, InventoryQuery>({
      query: (params) => ({ url: '/inventory', params }),
      providesTags: ['Inventory'],
    }),
    getInventoryItemById: builder.query<InventoryItemDto, string>({
      query: (id) => ({ url: `/inventory/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Inventory' as const, id }],
    }),
    createInventoryItem: builder.mutation<InventoryItemDto, CreateInventoryItemRequest>({
      query: (data) => ({ url: '/inventory', method: 'POST', data }),
      invalidatesTags: ['Inventory'],
    }),
    updateInventoryItem: builder.mutation<InventoryItemDto, { id: string; data: UpdateInventoryItemRequest }>({
      query: ({ id, data }) => ({ url: `/inventory/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Inventory'],
    }),
    deleteInventoryItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/inventory/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Inventory'],
    }),
    getStockTransactions: builder.query<StockTransactionDto[], string>({
      query: (id) => ({ url: `/inventory/${id}/transactions` }),
      providesTags: ['Inventory'],
    }),
    addStockTransaction: builder.mutation<StockTransactionDto, { id: string; data: AddStockTransactionRequest }>({
      query: ({ id, data }) => ({ url: `/inventory/${id}/transactions`, method: 'POST', data }),
      invalidatesTags: ['Inventory'],
    }),
  }),
});

export const {
  useGetInventoryItemsQuery, useGetInventoryItemByIdQuery,
  useCreateInventoryItemMutation, useUpdateInventoryItemMutation, useDeleteInventoryItemMutation,
  useGetStockTransactionsQuery, useAddStockTransactionMutation,
} = inventoryApi;
