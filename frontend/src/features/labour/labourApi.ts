import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  LabourDto,
  LabourAttendanceDto,
  LabourAdvanceDto,
  LabourLedgerDto,
  CreateLabourRequest,
  UpdateLabourRequest,
  UpsertAttendanceRequest,
  AddAdvanceRequest,
} from '../../types/labour.types';

export const labourApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabours: builder.query<
      PaginatedList<LabourDto>,
      { pageNumber?: number; pageSize?: number; search?: string; trade?: string; isActive?: boolean }
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
    getLabourAdvances: builder.query<LabourAdvanceDto[], string>({
      query: (id) => ({ url: `/labour/${id}/advances` }),
      providesTags: ['Labour'],
    }),
    addLabourAdvance: builder.mutation<LabourAdvanceDto, { id: string; data: AddAdvanceRequest }>({
      query: ({ id, data }) => ({ url: `/labour/${id}/advances`, method: 'POST', data }),
      invalidatesTags: ['Labour'],
    }),
    getLabourLedger: builder.query<LabourLedgerDto, { id: string; month: number; year: number }>({
      query: ({ id, month, year }) => ({
        url: `/labour/${id}/ledger`,
        params: { month, year },
      }),
      providesTags: ['Labour'],
    }),
  }),
});

export const {
  useGetLaboursQuery,
  useGetLabourByIdQuery,
  useCreateLabourMutation,
  useUpdateLabourMutation,
  useDeactivateLabourMutation,
  useGetLabourAttendanceQuery,
  useUpsertAttendanceMutation,
  useGetLabourAdvancesQuery,
  useAddLabourAdvanceMutation,
  useGetLabourLedgerQuery,
} = labourApi;
