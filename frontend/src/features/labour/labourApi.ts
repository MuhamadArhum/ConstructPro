import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  LabourDto,
  LabourAttendanceDto,
  LabourAdvanceDto,
  LabourLedgerDto,
  LabourSummaryDto,
  LabourAttendanceByDateItem,
  LabourPayrollSummaryItem,
  LabourProjectAssignment,
  CreateLabourRequest,
  UpdateLabourRequest,
  UpsertAttendanceRequest,
  AddAdvanceRequest,
  AssignLabourToProjectRequest,
} from '../../types/labour.types';

export const labourApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabours: builder.query<
      PaginatedList<LabourDto>,
      {
        pageNumber?: number;
        pageSize?: number;
        search?: string;
        trade?: string;
        isActive?: boolean;
        joinDateFrom?: string;
        joinDateTo?: string;
      }
    >({
      query: (params) => ({ url: '/labour', params }),
      providesTags: ['Labour'],
    }),
    getLabourById: builder.query<LabourDto, string>({
      query: (id) => ({ url: `/labour/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Labour' as const, id }],
    }),
    createLabour: builder.mutation<LabourDto, CreateLabourRequest>({
      query: (data) => ({ url: '/labour', method: 'POST', data }),
      invalidatesTags: ['Labour'],
    }),
    updateLabour: builder.mutation<LabourDto, { id: string; data: UpdateLabourRequest }>({
      query: ({ id, data }) => ({ url: `/labour/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Labour'],
    }),
    deactivateLabour: builder.mutation<void, string>({
      query: (id) => ({ url: `/labour/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Labour'],
    }),
    activateLabour: builder.mutation<void, string>({
      query: (id) => ({ url: `/labour/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['Labour'],
    }),
    getLabourAttendance: builder.query<
      LabourAttendanceDto[],
      { id: string; month: number; year: number }
    >({
      query: ({ id, month, year }) => ({
        url: `/labour/${id}/attendance`,
        params: { month, year },
      }),
      providesTags: ['Labour'],
    }),
    upsertAttendance: builder.mutation<LabourAttendanceDto, UpsertAttendanceRequest>({
      query: (data) => ({ url: '/labour/attendance', method: 'POST', data }),
      invalidatesTags: ['Labour'],
    }),
    bulkUpsertAttendance: builder.mutation<{ saved: number }, { records: UpsertAttendanceRequest[] }>({
      query: (data) => ({ url: '/labour/attendance/bulk', method: 'POST', data }),
      invalidatesTags: ['Labour'],
    }),
    getLabourAdvances: builder.query<LabourAdvanceDto[], string>({
      query: (id) => ({ url: `/labour/${id}/advances` }),
      providesTags: ['Labour'],
    }),
    addLabourAdvance: builder.mutation<LabourAdvanceDto, { id: string; data: AddAdvanceRequest }>({
      query: ({ id, data }) => ({ url: `/labour/${id}/advances`, method: 'POST', data }),
      invalidatesTags: ['Labour'],
    }),
    deleteLabourAdvance: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/labour/advances/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Labour'],
    }),
    getLabourLedger: builder.query<LabourLedgerDto, { id: string; month: number; year: number }>({
      query: ({ id, month, year }) => ({
        url: `/labour/${id}/ledger`,
        params: { month, year },
      }),
      providesTags: ['Labour'],
    }),
    getNextLabourCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/labour/next-code' }),
    }),
    getLabourSummary: builder.query<LabourSummaryDto, void>({
      query: () => ({ url: '/labour/summary' }),
      providesTags: ['Labour'],
    }),
    getLabourAttendanceByDate: builder.query<LabourAttendanceByDateItem[], string>({
      query: (date) => ({ url: '/labour/attendance/by-date', params: { date } }),
      providesTags: ['Labour'],
    }),
    getLabourPayrollSummary: builder.query<
      LabourPayrollSummaryItem[],
      { month: number; year: number }
    >({
      query: ({ month, year }) => ({
        url: '/labour/payroll-summary',
        params: { month, year },
      }),
      providesTags: ['Labour'],
    }),
    getLabourProjects: builder.query<LabourProjectAssignment[], string>({
      query: (id) => ({ url: `/labour/${id}/projects` }),
      providesTags: ['Labour'],
    }),
    assignLabourToProject: builder.mutation<
      LabourProjectAssignment,
      { id: string; data: AssignLabourToProjectRequest }
    >({
      query: ({ id, data }) => ({ url: `/labour/${id}/projects`, method: 'POST', data }),
      invalidatesTags: ['Labour'],
    }),
    removeLabourProject: builder.mutation<
      { deleted: boolean },
      { labourId: string; projectId: string }
    >({
      query: ({ labourId, projectId }) => ({
        url: `/labour/${labourId}/projects/${projectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Labour'],
    }),
  }),
});

export const {
  useGetLaboursQuery,
  useGetLabourByIdQuery,
  useCreateLabourMutation,
  useUpdateLabourMutation,
  useDeactivateLabourMutation,
  useActivateLabourMutation,
  useGetLabourAttendanceQuery,
  useUpsertAttendanceMutation,
  useBulkUpsertAttendanceMutation,
  useGetLabourAdvancesQuery,
  useAddLabourAdvanceMutation,
  useDeleteLabourAdvanceMutation,
  useGetLabourLedgerQuery,
  useGetNextLabourCodeQuery,
  useGetLabourSummaryQuery,
  useGetLabourAttendanceByDateQuery,
  useGetLabourPayrollSummaryQuery,
  useGetLabourProjectsQuery,
  useAssignLabourToProjectMutation,
  useRemoveLabourProjectMutation,
} = labourApi;
