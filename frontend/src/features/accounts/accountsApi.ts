import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { ChartOfAccountDto, CreateChartOfAccountRequest, UpdateChartOfAccountRequest, AccountQuery, JournalEntryDto, CreateJournalEntryRequest, JournalEntryQuery, AccountLedgerDto, LedgerQuery } from '../../types/accounts.types';

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query<PaginatedList<ChartOfAccountDto>, AccountQuery>({
      query: (params) => ({ url: '/accounts/chart', params }),
      providesTags: ['Account'],
    }),
    getAccountById: builder.query<ChartOfAccountDto, string>({
      query: (id) => ({ url: `/accounts/chart/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Account' as const, id }],
    }),
    createAccount: builder.mutation<ChartOfAccountDto, CreateChartOfAccountRequest>({
      query: (data) => ({ url: '/accounts/chart', method: 'POST', data }),
      invalidatesTags: ['Account'],
    }),
    updateAccount: builder.mutation<ChartOfAccountDto, { id: string; data: UpdateChartOfAccountRequest }>({
      query: ({ id, data }) => ({ url: `/accounts/chart/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Account'],
    }),
    deleteAccount: builder.mutation<void, string>({
      query: (id) => ({ url: `/accounts/chart/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Account'],
    }),
    getJournalEntries: builder.query<PaginatedList<JournalEntryDto>, JournalEntryQuery>({
      query: (params) => ({ url: '/accounts/journal', params }),
      providesTags: ['JournalEntry'],
    }),
    getJournalEntryById: builder.query<JournalEntryDto, string>({
      query: (id) => ({ url: `/accounts/journal/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'JournalEntry' as const, id }],
    }),
    createJournalEntry: builder.mutation<JournalEntryDto, CreateJournalEntryRequest>({
      query: (data) => ({ url: '/accounts/journal', method: 'POST', data }),
      invalidatesTags: ['JournalEntry', 'Account'],
    }),
    deleteJournalEntry: builder.mutation<void, string>({
      query: (id) => ({ url: `/accounts/journal/${id}`, method: 'DELETE' }),
      invalidatesTags: ['JournalEntry', 'Account'],
    }),
    getLevel4Accounts: builder.query<ChartOfAccountDto[], void>({
      query: () => ({ url: '/accounts/chart/level4' }),
      providesTags: ['Account'],
    }),
    getAccountLedger: builder.query<AccountLedgerDto, { id: string; params?: LedgerQuery }>({
      query: ({ id, params }) => ({ url: `/accounts/chart/${id}/ledger`, params }),
      providesTags: (_r, _e, { id }) => [{ type: 'Account' as const, id }],
    }),
  }),
});

export const {
  useGetAccountsQuery, useGetAccountByIdQuery, useCreateAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation,
  useGetJournalEntriesQuery, useGetJournalEntryByIdQuery, useCreateJournalEntryMutation, useDeleteJournalEntryMutation,
  useGetLevel4AccountsQuery, useGetAccountLedgerQuery,
} = accountsApi;
