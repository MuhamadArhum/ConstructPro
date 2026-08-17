import { baseApi } from '../../api/baseApi';
import type { Invoice, CreateInvoiceDto } from '../../types/invoice.types';

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<{ data: Invoice[]; total: number }, { page?: number; pageSize?: number; status?: string; customerId?: string; search?: string }>({
      query: (params) => ({ url: '/invoices', params }),
      providesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    getInvoice: builder.query<Invoice, string>({
      query: (id) => ({ url: `/invoices/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Invoice' as const, id }],
    }),
    createInvoice: builder.mutation<Invoice, CreateInvoiceDto>({
      query: (data) => ({ url: '/invoices', method: 'POST', data }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    updateInvoice: builder.mutation<Invoice, { id: string; data: Partial<CreateInvoiceDto> }>({
      query: ({ id, data }) => ({ url: `/invoices/${id}`, method: 'PATCH', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Invoice', id: 'LIST' }, { type: 'Invoice' as const, id }],
    }),
    updateInvoiceStatus: builder.mutation<Invoice, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/invoices/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Invoice', id: 'LIST' }, { type: 'Invoice' as const, id }, 'Customer'],
    }),
    deleteInvoice: builder.mutation<void, string>({
      query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
  useDeleteInvoiceMutation,
} = invoiceApi;
