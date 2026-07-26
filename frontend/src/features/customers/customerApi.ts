import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { CustomerDto, CreateCustomerRequest, UpdateCustomerRequest, CustomerQuery } from '../../types/customer.types';

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
  }),
});

export const { useGetCustomersQuery, useGetCustomerByIdQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } = customerApi;
