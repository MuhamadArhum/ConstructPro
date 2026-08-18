import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type {
  EmployeeDto,
  EmployeeSummaryDto,
  SalaryPaymentDto,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ProcessSalaryRequest,
  BulkProcessSalaryRequest,
  BulkProcessSalaryResult,
} from '../../types/employee.types';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<
      PaginatedList<EmployeeDto>,
      {
        pageNumber?: number;
        pageSize?: number;
        search?: string;
        department?: string;
        isActive?: boolean;
        joinDateFrom?: string;
        joinDateTo?: string;
        all?: boolean;
      }
    >({
      query: (params) => ({ url: '/employees', params }),
      providesTags: ['Employee'],
    }),
    getEmployeeById: builder.query<EmployeeDto, string>({
      query: (id) => ({ url: `/employees/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Employee' as const, id }],
    }),
    getEmployeeSummary: builder.query<EmployeeSummaryDto, void>({
      query: () => ({ url: '/employees/summary' }),
      providesTags: ['Employee'],
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
    deleteSalary: builder.mutation<SalaryPaymentDto, string>({
      query: (salaryId) => ({ url: `/employees/salary/${salaryId}`, method: 'DELETE' }),
      invalidatesTags: ['Employee', 'Dashboard'],
    }),
    getAllSalaries: builder.query<SalaryPaymentDto[], { month: number; year: number }>({
      query: ({ month, year }) => ({ url: '/employees/salaries', params: { month, year } }),
      providesTags: ['Employee'],
    }),
    bulkProcessSalary: builder.mutation<BulkProcessSalaryResult, BulkProcessSalaryRequest>({
      query: (data) => ({ url: '/employees/salary/bulk', method: 'POST', data }),
      invalidatesTags: ['Employee', 'Dashboard'],
    }),
    getNextEmployeeCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/employees/next-code' }),
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useGetEmployeeSummaryQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useActivateEmployeeMutation,
  useGetSalaryHistoryQuery,
  useProcessSalaryMutation,
  useDeleteSalaryMutation,
  useGetAllSalariesQuery,
  useBulkProcessSalaryMutation,
  useGetNextEmployeeCodeQuery,
} = employeesApi;
