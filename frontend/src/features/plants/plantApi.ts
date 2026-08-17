import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { PlantDto, CreatePlantRequest, UpdatePlantRequest, PlantQuery, PlantMaintenanceDto, AddPlantMaintenanceRequest } from '../../types/plant.types';

export const plantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlants: builder.query<PaginatedList<PlantDto>, PlantQuery>({
      query: (params) => ({ url: '/plant', params }),
      providesTags: ['Plant'],
    }),
    getPlantById: builder.query<PlantDto, string>({
      query: (id) => ({ url: `/plant/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Plant' as const, id }],
    }),
    createPlant: builder.mutation<PlantDto, CreatePlantRequest>({
      query: (data) => ({ url: '/plant', method: 'POST', data }),
      invalidatesTags: ['Plant'],
    }),
    updatePlant: builder.mutation<PlantDto, { id: string; data: UpdatePlantRequest }>({
      query: ({ id, data }) => ({ url: `/plant/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Plant'],
    }),
    deletePlant: builder.mutation<void, string>({
      query: (id) => ({ url: `/plant/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Plant'],
    }),
    getNextPlantCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/plant/next-code' }),
    }),
    getPlantMaintenanceHistory: builder.query<PlantMaintenanceDto[], string>({
      query: (id) => ({ url: `/plant/${id}/maintenance` }),
      providesTags: (_r, _e, id) => [{ type: 'Plant' as const, id: `maintenance-${id}` }],
    }),
    addPlantMaintenance: builder.mutation<PlantMaintenanceDto, { id: string; data: AddPlantMaintenanceRequest }>({
      query: ({ id, data }) => ({ url: `/plant/${id}/maintenance`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => ['Plant', { type: 'Plant' as const, id: `maintenance-${id}` }],
    }),
    deletePlantMaintenance: builder.mutation<void, { plantId: string; recordId: string }>({
      query: ({ plantId, recordId }) => ({ url: `/plant/${plantId}/maintenance/${recordId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { plantId }) => ['Plant', { type: 'Plant' as const, id: `maintenance-${plantId}` }],
    }),
  }),
});

export const {
  useGetPlantsQuery, useGetPlantByIdQuery, useCreatePlantMutation, useUpdatePlantMutation,
  useDeletePlantMutation, useGetNextPlantCodeQuery,
  useGetPlantMaintenanceHistoryQuery, useAddPlantMaintenanceMutation, useDeletePlantMaintenanceMutation,
} = plantApi;
