import { baseApi } from '../../api/baseApi';
import type {
  BoqDto, CreateBoqRequest, UpdateBoqRequest,
  BoqSectionDto, CreateBoqSectionRequest, UpdateBoqSectionRequest,
  BoqItemDto, CreateBoqItemRequest, UpdateBoqItemRequest,
} from '../../types/boq.types';

export const boqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBoqByProject: builder.query<BoqDto | null, string>({
      query: (projectId) => ({ url: `/boq/project/${projectId}` }),
      providesTags: (_r, _e, projectId) => [{ type: 'Boq' as const, id: projectId }],
    }),
    createBoq: builder.mutation<BoqDto, { projectId: string; data: CreateBoqRequest }>({
      query: ({ projectId, data }) => ({ url: `/boq/project/${projectId}`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
    updateBoq: builder.mutation<BoqDto, { projectId: string; data: UpdateBoqRequest }>({
      query: ({ projectId, data }) => ({ url: `/boq/project/${projectId}`, method: 'PUT', data }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
    deleteBoq: builder.mutation<void, string>({
      query: (projectId) => ({ url: `/boq/project/${projectId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, projectId) => [{ type: 'Boq' as const, id: projectId }],
    }),
    addBoqSection: builder.mutation<BoqSectionDto, { projectId: string; data: CreateBoqSectionRequest }>({
      query: ({ projectId, data }) => ({ url: `/boq/project/${projectId}/sections`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
    updateBoqSection: builder.mutation<BoqSectionDto, { sectionId: string; projectId: string; data: UpdateBoqSectionRequest }>({
      query: ({ sectionId, data }) => ({ url: `/boq/sections/${sectionId}`, method: 'PUT', data }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
    deleteBoqSection: builder.mutation<void, { sectionId: string; projectId: string }>({
      query: ({ sectionId }) => ({ url: `/boq/sections/${sectionId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
    addBoqItem: builder.mutation<BoqItemDto, { sectionId: string; projectId: string; data: CreateBoqItemRequest }>({
      query: ({ sectionId, data }) => ({ url: `/boq/sections/${sectionId}/items`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
    updateBoqItem: builder.mutation<BoqItemDto, { itemId: string; projectId: string; data: UpdateBoqItemRequest }>({
      query: ({ itemId, data }) => ({ url: `/boq/items/${itemId}`, method: 'PUT', data }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
    deleteBoqItem: builder.mutation<void, { itemId: string; projectId: string }>({
      query: ({ itemId }) => ({ url: `/boq/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Boq' as const, id: projectId }],
    }),
  }),
});

export const {
  useGetBoqByProjectQuery,
  useCreateBoqMutation,
  useUpdateBoqMutation,
  useDeleteBoqMutation,
  useAddBoqSectionMutation,
  useUpdateBoqSectionMutation,
  useDeleteBoqSectionMutation,
  useAddBoqItemMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,
} = boqApi;
