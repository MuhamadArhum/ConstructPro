import { baseApi } from '../../api/baseApi';
import type { DashboardDto } from '../../types/dashboard.types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardDto, void>({
      query: () => ({ url: '/dashboard' }),
      providesTags: ['Income', 'Expense', 'Project', 'Customer', 'Supplier', 'Inventory'],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
