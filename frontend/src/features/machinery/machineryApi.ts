import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  MachineryDto,
  MachineryMaintenanceDto,
  CreateMachineryRequest,
  UpdateMachineryRequest,
  AddMaintenanceRequest,
} from '../../types/machinery.types';

export const machineryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMachineries: builder.query<
      PaginatedList<MachineryDto>,
      { pageNumber?: number; pageSize?: number; search?: string; status?: string }
    >({
      query: (params) => ({ url: '/machinery', params }),
      providesTags: ['Machinery'],
    }),
    getMachineryById: builder.query<MachineryDto, string>({
      query: (id) => ({ url: `/machinery/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Machinery' as const, id }],
    }),
    createMachinery: builder.mutation<MachineryDto, CreateMachineryRequest>({
      query: (data) => ({ url: '/machinery', method: 'POST', data }),
      invalidatesTags: ['Machinery'],
    }),
    updateMachinery: builder.mutation<MachineryDto, { id: string; data: UpdateMachineryRequest }>({
      query: ({ id, data }) => ({ url: `/machinery/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Machinery'],
    }),
    deleteMachinery: builder.mutation<void, string>({
      query: (id) => ({ url: `/machinery/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Machinery'],
    }),
    getMaintenanceHistory: builder.query<MachineryMaintenanceDto[], string>({
      query: (id) => ({ url: `/machinery/${id}/maintenance` }),
      providesTags: ['Machinery'],
    }),
    addMaintenance: builder.mutation<
      MachineryMaintenanceDto,
      { id: string; data: AddMaintenanceRequest }
    >({
      query: ({ id, data }) => ({ url: `/machinery/${id}/maintenance`, method: 'POST', data }),
      invalidatesTags: ['Machinery', 'Dashboard'],
    }),
    getMaintenanceDue: builder.query<MachineryDto[], void>({
      query: () => ({ url: '/machinery/maintenance-due' }),
      providesTags: ['Machinery'],
    }),
  }),
});

export const {
  useGetMachineriesQuery,
  useGetMachineryByIdQuery,
  useCreateMachineryMutation,
  useUpdateMachineryMutation,
  useDeleteMachineryMutation,
  useGetMaintenanceHistoryQuery,
  useAddMaintenanceMutation,
  useGetMaintenanceDueQuery,
} = machineryApi;
