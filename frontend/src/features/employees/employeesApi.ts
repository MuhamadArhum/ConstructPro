import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  EmployeeDto,
  SalaryPaymentDto,
  EmployeeAdvanceDto,
  PendingAdvancesDto,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ProcessSalaryRequest,
  UpdateSalaryRequest,
  MarkSalaryAsPaidRequest,
} from '../../types/employee.types';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<
      PaginatedList<EmployeeDto>,
      { pageNumber?: number; pageSize?: number; search?: string; department?: string; isActive?: boolean }
    >({
      query: (params) => ({ url: '/employees', params }),
      providesTags: ['Employee'],
    }),
    getEmployeeById: builder.query<EmployeeDto, string>({
      query: (id) => ({ url: `/employees/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Employee' as const, id }],
    }),
    createEmployee: builder.mutation<EmployeeDto, CreateEmployeeRequest>({
      query: (data) => ({ url: '/employees', method: 'POST', data }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: builder.mutation<EmployeeDto, { id: string; data: UpdateEmployeeRequest }>({
      query: ({ id, data }) => ({ url: `/employees/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Employee'],
    }),
    deactivateEmployee: builder.mutation<void, string>({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employee'],
    }),
    activateEmployee: builder.mutation<void, string>({
      query: (id) => ({ url: `/employees/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['Employee'],
    }),
    getSalaryHistory: builder.query<SalaryPaymentDto[], string>({
      query: (id) => ({ url: `/employees/${id}/salary-history` }),
      providesTags: ['Employee'],
    }),
    processSalary: builder.mutation<
      SalaryPaymentDto,
      { id: string; data: ProcessSalaryRequest }
    >({
      query: ({ id, data }) => ({ url: `/employees/${id}/salary`, method: 'POST', data }),
      invalidatesTags: ['Employee', 'Dashboard'],
    }),
    getAllSalaries: builder.query<SalaryPaymentDto[], { month: number; year: number }>({
      query: ({ month, year }) => ({ url: '/employees/salaries', params: { month, year } }),
      providesTags: ['Employee'],
    }),
    markSalaryAsPaid: builder.mutation<SalaryPaymentDto, { id: string; salaryId: string; data: MarkSalaryAsPaidRequest }>({
      query: ({ id, salaryId, data }) => ({ url: `/employees/${id}/salary/${salaryId}/pay`, method: 'PATCH', data }),
      invalidatesTags: ['Employee'],
    }),
    updateSalary: builder.mutation<SalaryPaymentDto, { id: string; salaryId: string; data: UpdateSalaryRequest }>({
      query: ({ id, salaryId, data }) => ({ url: `/employees/${id}/salary/${salaryId}`, method: 'PUT', data }),
      invalidatesTags: ['Employee'],
    }),
    deleteSalary: builder.mutation<void, { id: string; salaryId: string }>({
      query: ({ id, salaryId }) => ({ url: `/employees/${id}/salary/${salaryId}`, method: 'DELETE' }),
      invalidatesTags: ['Employee'],
    }),
    getNextEmployeeCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/employees/next-code' }),
    }),
    getAdvances: builder.query<EmployeeAdvanceDto[], string>({
      query: (id) => ({ url: `/employees/${id}/advances` }),
      providesTags: (_r, _e, id) => [{ type: 'Employee' as const, id: `${id}-advances` }],
    }),
    getPendingAdvances: builder.query<PendingAdvancesDto, string>({
      query: (id) => ({ url: `/employees/${id}/advances/pending` }),
      providesTags: (_r, _e, id) => [{ type: 'Employee' as const, id: `${id}-advances` }],
    }),
    addAdvance: builder.mutation<EmployeeAdvanceDto, { id: string; data: { amount: number; date: string; reason?: string } }>({
      query: ({ id, data }) => ({ url: `/employees/${id}/advances`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Employee' as const, id: `${id}-advances` }],
    }),
    deleteAdvance: builder.mutation<void, { id: string; advanceId: string }>({
      query: ({ id, advanceId }) => ({ url: `/employees/${id}/advances/${advanceId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Employee' as const, id: `${id}-advances` }],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useActivateEmployeeMutation,
  useGetSalaryHistoryQuery,
  useProcessSalaryMutation,
  useMarkSalaryAsPaidMutation,
  useUpdateSalaryMutation,
  useDeleteSalaryMutation,
  useGetAllSalariesQuery,
  useGetNextEmployeeCodeQuery,
  useGetAdvancesQuery,
  useGetPendingAdvancesQuery,
  useAddAdvanceMutation,
  useDeleteAdvanceMutation,
} = employeesApi;
