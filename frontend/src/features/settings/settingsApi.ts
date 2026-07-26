import { baseApi } from '../../api/baseApi';
import type { CompanySettingsDto, UpdateCompanySettingsRequest } from '../../types/settings.types';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<CompanySettingsDto, void>({
      query: () => ({ url: '/settings' }),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<CompanySettingsDto, UpdateCompanySettingsRequest>({
      query: (data) => ({ url: '/settings', method: 'PUT', data }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
