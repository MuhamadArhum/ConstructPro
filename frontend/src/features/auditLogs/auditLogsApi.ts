import { baseApi } from '../../api/baseApi';
import type { AuditLogDto, AuditLogQueryParams } from '../../types/audit.types';
import type { PaginatedList } from '../../types/common.types';

export const auditLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<PaginatedList<AuditLogDto>, AuditLogQueryParams>({
      query: (params = {}) => ({ url: '/auditlogs', method: 'GET', params }),
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAuditLogsQuery } = auditLogsApi;
