import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import axiosClient from './axiosClient';

interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
}

const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, { status?: number; data: unknown }> =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const result = await axiosClient({ url, method, data, params });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data ?? err.message,
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  keepUnusedDataFor: 300,
  tagTypes: ['User', 'CurrentUser', 'Role', 'Permission', 'AuditLog', 'Income', 'Expense', 'Labour', 'Employee', 'Machinery', 'Dashboard', 'Vehicle', 'Plant', 'Customer', 'Supplier', 'Inventory', 'Tax', 'Account', 'JournalEntry', 'Notification', 'Settings'],
  endpoints: () => ({}),
});
