import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { PlantDto, CreatePlantRequest, UpdatePlantRequest, PlantQuery } from '../../types/plant.types';

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
  }),
});

export const { useGetPlantsQuery, useGetPlantByIdQuery, useCreatePlantMutation, useUpdatePlantMutation, useDeletePlantMutation, useGetNextPlantCodeQuery } = plantApi;
