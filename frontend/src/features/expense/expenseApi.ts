import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  ExpenseDto,
  ExpenseSummaryDto,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseQuery,
} from '../../types/expense.types';

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<PaginatedList<ExpenseDto>, ExpenseQuery>({
      query: (params) => ({ url: '/expense', params }),
      providesTags: ['Expense'],
    }),
    getExpenseById: builder.query<ExpenseDto, string>({
      query: (id) => ({ url: `/expense/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Expense' as const, id }],
    }),
    createExpense: builder.mutation<ExpenseDto, CreateExpenseRequest>({
      query: (data) => ({ url: '/expense', method: 'POST', data }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
    updateExpense: builder.mutation<ExpenseDto, { id: string; data: UpdateExpenseRequest }>({
      query: ({ id, data }) => ({ url: `/expense/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({ url: `/expense/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
    getExpenseSummary: builder.query<ExpenseSummaryDto, void>({
      query: () => ({ url: '/expense/summary' }),
      providesTags: ['Expense'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseSummaryQuery,
} = expenseApi;
