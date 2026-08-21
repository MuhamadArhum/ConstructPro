import { baseApi } from '../../api/baseApi';

export interface UserCategory {
  id: string;
  type: string;
  name: string;
  isSystem: boolean;
  createdAt: string;
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenseCategories: builder.query<UserCategory[], void>({
      query: () => ({ url: '/categories/expense' }),
      providesTags: [{ type: 'Category' as const, id: 'expense' }],
    }),
    getIncomeCategories: builder.query<UserCategory[], void>({
      query: () => ({ url: '/categories/income' }),
      providesTags: [{ type: 'Category' as const, id: 'income' }],
    }),
    createExpenseCategory: builder.mutation<UserCategory, { name: string }>({
      query: (data) => ({ url: '/categories/expense', method: 'POST', data }),
      invalidatesTags: [{ type: 'Category' as const, id: 'expense' }],
    }),
    createIncomeCategory: builder.mutation<UserCategory, { name: string }>({
      query: (data) => ({ url: '/categories/income', method: 'POST', data }),
      invalidatesTags: [{ type: 'Category' as const, id: 'income' }],
    }),
    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Category' as const, id: 'expense' }, { type: 'Category' as const, id: 'income' }],
    }),
  }),
});

export const {
  useGetExpenseCategoriesQuery,
  useGetIncomeCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useCreateIncomeCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
