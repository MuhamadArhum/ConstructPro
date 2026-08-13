import { baseApi } from '../../api/baseApi';
import type { Project, ProjectDetail, ProjectStats, ProjectMilestone, ProjectExpense, ProjectLabour, ProjectMachinery } from '../../types/project.types';

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<{ data: Project[]; total: number }, { page?: number; pageSize?: number; search?: string; status?: string }>({
      query: (params) => ({ url: '/projects', params }),
      providesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    getProject: builder.query<ProjectDetail, string>({
      query: (id) => ({ url: `/projects/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Project' as const, id }],
    }),
    createProject: builder.mutation<Project, Partial<Project>>({
      query: (data) => ({ url: '/projects', method: 'POST', data }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    updateProject: builder.mutation<Project, { id: string; data: Partial<Project> }>({
      query: ({ id, data }) => ({ url: `/projects/${id}`, method: 'PATCH', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id: 'LIST' }, { type: 'Project' as const, id }],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    getProjectStats: builder.query<ProjectStats, string>({
      query: (id) => ({ url: `/projects/${id}/stats` }),
    }),
    addMilestone: builder.mutation<ProjectMilestone, { id: string; data: Partial<ProjectMilestone> }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/milestones`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    updateMilestone: builder.mutation<ProjectMilestone, { id: string; mid: string; data: Partial<ProjectMilestone> }>({
      query: ({ id, mid, data }) => ({ url: `/projects/${id}/milestones/${mid}`, method: 'PATCH', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    deleteMilestone: builder.mutation<void, { id: string; mid: string }>({
      query: ({ id, mid }) => ({ url: `/projects/${id}/milestones/${mid}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    addProjectExpense: builder.mutation<ProjectExpense, { id: string; data: Partial<ProjectExpense> }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/expenses`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    deleteProjectExpense: builder.mutation<void, { id: string; expId: string }>({
      query: ({ id, expId }) => ({ url: `/projects/${id}/expenses/${expId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    assignLabour: builder.mutation<ProjectLabour, { id: string; data: { labourId: string } }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/labours`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    removeLabour: builder.mutation<void, { id: string; labourId: string }>({
      query: ({ id, labourId }) => ({ url: `/projects/${id}/labours/${labourId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    assignMachinery: builder.mutation<ProjectMachinery, { id: string; data: { machineryId: string } }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/machinery`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    removeMachinery: builder.mutation<void, { id: string; machineryId: string }>({
      query: ({ id, machineryId }) => ({ url: `/projects/${id}/machinery/${machineryId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    getNextProjectCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/projects/next-code' }),
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectStatsQuery,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useAddProjectExpenseMutation,
  useDeleteProjectExpenseMutation,
  useAssignLabourMutation,
  useRemoveLabourMutation,
  useAssignMachineryMutation,
  useRemoveMachineryMutation,
  useGetNextProjectCodeQuery,
} = projectApi;
