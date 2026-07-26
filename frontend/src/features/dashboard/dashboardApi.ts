import { baseApi } from '../../api/baseApi';
import type { DashboardStatsDto } from '../../types/dashboard.types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStatsDto, void>({
      query: () => ({ url: '/dashboard/stats' }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
