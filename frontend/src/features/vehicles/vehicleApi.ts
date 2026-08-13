import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { VehicleDto, VehicleMaintenanceDto, CreateVehicleRequest, UpdateVehicleRequest, CreateVehicleMaintenanceRequest, VehicleQuery } from '../../types/vehicle.types';

export const vehicleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVehicles: builder.query<PaginatedList<VehicleDto>, VehicleQuery>({
      query: (params) => ({ url: '/vehicle', params }),
      providesTags: ['Vehicle'],
    }),
    getVehicleById: builder.query<VehicleDto, string>({
      query: (id) => ({ url: `/vehicle/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Vehicle' as const, id }],
    }),
    createVehicle: builder.mutation<VehicleDto, CreateVehicleRequest>({
      query: (data) => ({ url: '/vehicle', method: 'POST', data }),
      invalidatesTags: ['Vehicle'],
    }),
    updateVehicle: builder.mutation<VehicleDto, { id: string; data: UpdateVehicleRequest }>({
      query: ({ id, data }) => ({ url: `/vehicle/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Vehicle'],
    }),
    deleteVehicle: builder.mutation<void, string>({
      query: (id) => ({ url: `/vehicle/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vehicle'],
    }),
    getVehicleMaintenance: builder.query<VehicleMaintenanceDto[], string>({
      query: (id) => ({ url: `/vehicle/${id}/maintenance` }),
      providesTags: ['Vehicle'],
    }),
    addVehicleMaintenance: builder.mutation<VehicleMaintenanceDto, { id: string; data: CreateVehicleMaintenanceRequest }>({
      query: ({ id, data }) => ({ url: `/vehicle/${id}/maintenance`, method: 'POST', data }),
      invalidatesTags: ['Vehicle'],
    }),
    getNextVehicleCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/vehicle/next-code' }),
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useGetVehicleByIdQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useGetVehicleMaintenanceQuery,
  useAddVehicleMaintenanceMutation,
  useGetNextVehicleCodeQuery,
} = vehicleApi;
