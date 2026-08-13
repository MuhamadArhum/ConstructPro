import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  IncomeDto,
  IncomeSummaryDto,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  IncomeQuery,
} from '../../types/income.types';

export const incomeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomes: builder.query<PaginatedList<IncomeDto>, IncomeQuery>({
      query: (params) => ({ url: '/income', params }),
      providesTags: ['Income'],
    }),
    getIncomeById: builder.query<IncomeDto, string>({
      query: (id) => ({ url: `/income/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Income' as const, id }],
    }),
    createIncome: builder.mutation<IncomeDto, CreateIncomeRequest>({
      query: (data) => ({ url: '/income', method: 'POST', data }),
      invalidatesTags: ['Income', 'Dashboard'],
    }),
    updateIncome: builder.mutation<IncomeDto, { id: string; data: UpdateIncomeRequest }>({
      query: ({ id, data }) => ({ url: `/income/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Income', 'Dashboard'],
    }),
    deleteIncome: builder.mutation<void, string>({
      query: (id) => ({ url: `/income/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Income', 'Dashboard'],
    }),
    getIncomeSummary: builder.query<IncomeSummaryDto, void>({
      query: () => ({ url: '/income/summary' }),
      providesTags: ['Income'],
    }),
    getNextIncomeCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/income/next-code' }),
    }),
  }),
});

export const {
  useGetIncomesQuery,
  useGetIncomeByIdQuery,
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
  useGetIncomeSummaryQuery,
  useGetNextIncomeCodeQuery,
} = incomeApi;
