import { baseApi } from '../../api/baseApi';
import type {
  AssignPermissionsRequest,
  CreateRoleRequest,
  PermissionDto,
  RoleDto,
} from '../../types/role.types';

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<RoleDto[], void>({
      query: () => ({ url: '/roles', method: 'GET' }),
      providesTags: [{ type: 'Role', id: 'LIST' }],
    }),
    getRoleById: builder.query<RoleDto, string>({
      query: (id) => ({ url: `/roles/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Role', id }],
    }),
    createRole: builder.mutation<RoleDto, CreateRoleRequest>({
      query: (body) => ({ url: '/roles', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),
    getAllPermissions: builder.query<PermissionDto[], void>({
      query: () => ({ url: '/roles/permissions', method: 'GET' }),
      providesTags: ['Permission'],
    }),
    assignPermissions: builder.mutation<void, { roleId: string; body: AssignPermissionsRequest }>({
      query: ({ roleId, body }) => ({
        url: `/roles/${roleId}/permissions`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: (_result, _error, { roleId }) => [{ type: 'Role', id: roleId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetAllPermissionsQuery,
  useAssignPermissionsMutation,
} = rolesApi;
