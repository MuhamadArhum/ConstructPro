import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  LabourDto,
  LabourAttendanceDto,
  LabourAdvanceDto,
  PendingLabourAdvancesDto,
  LabourLedgerDto,
  LabourWagePaymentDto,
  CreateLabourRequest,
  UpdateLabourRequest,
  UpsertAttendanceRequest,
  AddAdvanceRequest,
  SettleWagesRequest,
  MarkWagePaidRequest,
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
    bulkUpsertLabourAttendance: builder.mutation<{ saved: number }, { records: UpsertAttendanceRequest[] }>({
      query: (data) => ({ url: '/labour/attendance/bulk', method: 'POST', data }),
      invalidatesTags: ['Labour'],
    }),
    getLabourAdvances: builder.query<LabourAdvanceDto[], string>({
      query: (id) => ({ url: `/labour/${id}/advances` }),
      providesTags: (_r, _e, id) => [{ type: 'Labour' as const, id: `${id}-advances` }],
    }),
    getLabourPendingAdvances: builder.query<PendingLabourAdvancesDto, string>({
      query: (id) => ({ url: `/labour/${id}/advances/pending` }),
      providesTags: (_r, _e, id) => [{ type: 'Labour' as const, id: `${id}-advances` }],
    }),
    addLabourAdvance: builder.mutation<LabourAdvanceDto, { id: string; data: AddAdvanceRequest }>({
      query: ({ id, data }) => ({ url: `/labour/${id}/advances`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Labour' as const, id: `${id}-advances` }],
    }),
    deleteLabourAdvance: builder.mutation<void, { id: string; advanceId: string }>({
      query: ({ id, advanceId }) => ({ url: `/labour/${id}/advances/${advanceId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Labour' as const, id: `${id}-advances` }],
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
    getLabourWagePayments: builder.query<LabourWagePaymentDto[], string>({
      query: (id) => ({ url: `/labour/${id}/wages` }),
      providesTags: (_r, _e, id) => [{ type: 'Labour' as const, id: `${id}-wages` }],
    }),
    settleLabourWages: builder.mutation<LabourWagePaymentDto, { id: string; data: SettleWagesRequest }>({
      query: ({ id, data }) => ({ url: `/labour/${id}/wages`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Labour' as const, id: `${id}-wages` }, { type: 'Labour' as const, id: `${id}-advances` }],
    }),
    markLabourWageAsPaid: builder.mutation<LabourWagePaymentDto, { id: string; paymentId: string; data: MarkWagePaidRequest }>({
      query: ({ id, paymentId, data }) => ({ url: `/labour/${id}/wages/${paymentId}/pay`, method: 'PATCH', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Labour' as const, id: `${id}-wages` }],
    }),
    deleteLabourWagePayment: builder.mutation<void, { id: string; paymentId: string }>({
      query: ({ id, paymentId }) => ({ url: `/labour/${id}/wages/${paymentId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Labour' as const, id: `${id}-wages` }, { type: 'Labour' as const, id: `${id}-advances` }],
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
  useGetLabourAdvancesQuery,
  useGetLabourPendingAdvancesQuery,
  useAddLabourAdvanceMutation,
  useDeleteLabourAdvanceMutation,
  useGetLabourLedgerQuery,
  useGetNextLabourCodeQuery,
  useBulkUpsertLabourAttendanceMutation,
  useGetLabourWagePaymentsQuery,
  useSettleLabourWagesMutation,
  useMarkLabourWageAsPaidMutation,
  useDeleteLabourWagePaymentMutation,
} = labourApi;
