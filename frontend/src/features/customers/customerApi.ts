import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { CustomerDto, CreateCustomerRequest, UpdateCustomerRequest, CustomerQuery, CustomerLedgerResponse, CreateCustomerTransactionRequest } from '../../types/customer.types';

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedList<CustomerDto>, CustomerQuery>({
      query: (params) => ({ url: '/customer', params }),
      providesTags: ['Customer'],
    }),
    getCustomerById: builder.query<CustomerDto, string>({
      query: (id) => ({ url: `/customer/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Customer' as const, id }],
    }),
    createCustomer: builder.mutation<CustomerDto, CreateCustomerRequest>({
      query: (data) => ({ url: '/customer', method: 'POST', data }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<CustomerDto, { id: string; data: UpdateCustomerRequest }>({
      query: ({ id, data }) => ({ url: `/customer/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({ url: `/customer/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),
    getCustomerLedger: builder.query<CustomerLedgerResponse, { id: string; fromDate?: string; toDate?: string }>({
      query: ({ id, fromDate, toDate }) => ({ url: `/customer/${id}/ledger`, params: { fromDate, toDate } }),
      providesTags: (_r, _e, { id }) => [{ type: 'Customer' as const, id: `ledger-${id}` }],
    }),
    addCustomerTransaction: builder.mutation<void, { id: string; data: CreateCustomerTransactionRequest }>({
      query: ({ id, data }) => ({ url: `/customer/${id}/transactions`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => ['Customer', { type: 'Customer' as const, id: `ledger-${id}` }],
    }),
    deleteCustomerTransaction: builder.mutation<void, { customerId: string; txId: string }>({
      query: ({ customerId, txId }) => ({ url: `/customer/${customerId}/transactions/${txId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { customerId }) => ['Customer', { type: 'Customer' as const, id: `ledger-${customerId}` }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerLedgerQuery,
  useAddCustomerTransactionMutation,
  useDeleteCustomerTransactionMutation,
} = customerApi;
