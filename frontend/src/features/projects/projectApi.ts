import { baseApi } from '../../api/baseApi';
import type { Project, ProjectDetail, ProjectStats, ProjectMilestone, ProjectExpense, ProjectLabour, ProjectMachinery, ProjectEmployee } from '../../types/project.types';

export interface ProjectIncome {
  id: string;
  projectId: string;
  category: string;
  amount: number;
  date: string;
  description?: string | null;
  source?: string | null;
  createdAt: string;
}

export interface ProjectPnL {
  period: { month?: number; year?: number; from?: string; to?: string };
  totalIncome: number;
  totalDirectExpenses: number;
  totalLabourCost: number;
  totalSalaryCost: number;
  totalCost: number;
  grossProfit: number;
  isProfitable: boolean;
  incomeBreakdown: { category: string; amount: number; date: string; description?: string | null }[];
  expenseBreakdown: { category: string; amount: number; date: string; description?: string | null }[];
}

export interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalSpent: number;
  overdueMilestones: number;
}

export interface ProjectEmployeeSalaryItem {
  id: string;
  fullName: string;
  designation: string | null;
  basicSalary: number;
  assignedAt: string;
  monthsCount: number;
  totalSalary: number;
  payments: { month: number; year: number; netSalary: number; daysPresent: number; totalDays: number; paidAt: string }[];
}

export interface ProjectLabourWageItem {
  id: string;
  name: string;
  trade: string | null;
  dailyWage: number;
  assignedAt: string;
  presentDays: number;
  totalOvertimeHours: number;
  wagesEarned: number;
  overtimePay: number;
  totalWages: number;
}

export interface ProjectPayrollSalary {
  id: string;
  code: string | null;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  daysPresent: number;
  totalDays: number;
  status: 'Generated' | 'Paid';
  generatedAt: string;
  paidDate?: string | null;
  remarks?: string | null;
}

export interface ProjectPayrollEmployee {
  employeeId: string;
  fullName: string;
  designation: string | null;
  basicSalary: number;
  attendanceDaysPresent: number;
  salary: ProjectPayrollSalary | null;
}

export interface ProjectPayrollLabour {
  labourId: string;
  name: string;
  trade: string | null;
  dailyWage: number;
  daysPresent: number;
  overtimeHours: number;
  wagesEarned: number;
  overtimePay: number;
  totalWages: number;
}

export interface ProjectPayroll {
  month: number;
  year: number;
  employees: ProjectPayrollEmployee[];
  labours: ProjectPayrollLabour[];
}

export interface ProjectSalaryExpense {
  period: { from: string; to: string };
  employees: ProjectEmployeeSalaryItem[];
  labours: ProjectLabourWageItem[];
  summary: { totalEmployeeSalary: number; totalLabourWages: number; grandTotal: number };
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<{ data: Project[]; total: number }, { page?: number; pageSize?: number; search?: string; status?: string; clientId?: string; startDateFrom?: string; startDateTo?: string }>({
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
    updateProjectExpense: builder.mutation<ProjectExpense, { id: string; expId: string; data: Partial<ProjectExpense> }>({
      query: ({ id, expId, data }) => ({ url: `/projects/${id}/expenses/${expId}`, method: 'PATCH', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    deleteProjectExpense: builder.mutation<void, { id: string; expId: string }>({
      query: ({ id, expId }) => ({ url: `/projects/${id}/expenses/${expId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    getProjectSummary: builder.query<ProjectSummary, void>({
      query: () => ({ url: '/projects/summary' }),
      providesTags: [{ type: 'Project', id: 'LIST' }],
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
    assignEmployee: builder.mutation<ProjectEmployee, { id: string; data: { employeeId: string } }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/employees`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    removeEmployee: builder.mutation<void, { id: string; employeeId: string }>({
      query: ({ id, employeeId }) => ({ url: `/projects/${id}/employees/${employeeId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    getNextProjectCode: builder.query<{ code: string }, void>({
      query: () => ({ url: '/projects/next-code' }),
    }),
    getProjectSalaryExpense: builder.query<ProjectSalaryExpense, string>({
      query: (id) => ({ url: `/projects/${id}/salary-expense` }),
      providesTags: (_r, _e, id) => [{ type: 'Project' as const, id }],
    }),
    getProjectPayroll: builder.query<ProjectPayroll, { id: string; month: number; year: number }>({
      query: ({ id, month, year }) => ({ url: `/projects/${id}/payroll`, params: { month, year } }),
      providesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }, 'Employee'],
    }),
    addProjectIncome: builder.mutation<ProjectIncome, { id: string; data: Partial<ProjectIncome> }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/incomes`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    updateProjectIncome: builder.mutation<ProjectIncome, { id: string; incomeId: string; data: Partial<ProjectIncome> }>({
      query: ({ id, incomeId, data }) => ({ url: `/projects/${id}/incomes/${incomeId}`, method: 'PATCH', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    deleteProjectIncome: builder.mutation<void, { id: string; incomeId: string }>({
      query: ({ id, incomeId }) => ({ url: `/projects/${id}/incomes/${incomeId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    getProjectPnL: builder.query<ProjectPnL, { id: string; month?: number; year?: number }>({
      query: ({ id, month, year }) => ({ url: `/projects/${id}/pnl`, params: { month, year } }),
      providesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    assignVehicle: builder.mutation<any, { id: string; data: { vehicleId: string } }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/vehicles`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    removeVehicle: builder.mutation<void, { id: string; vehicleId: string }>({
      query: ({ id, vehicleId }) => ({ url: `/projects/${id}/vehicles/${vehicleId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    assignPlant: builder.mutation<any, { id: string; data: { plantId: string } }>({
      query: ({ id, data }) => ({ url: `/projects/${id}/plants`, method: 'POST', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
    }),
    removePlant: builder.mutation<void, { id: string; plantId: string }>({
      query: ({ id, plantId }) => ({ url: `/projects/${id}/plants/${plantId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project' as const, id }],
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
  useUpdateProjectExpenseMutation,
  useDeleteProjectExpenseMutation,
  useAddProjectIncomeMutation,
  useUpdateProjectIncomeMutation,
  useDeleteProjectIncomeMutation,
  useGetProjectPnLQuery,
  useAssignLabourMutation,
  useRemoveLabourMutation,
  useAssignMachineryMutation,
  useRemoveMachineryMutation,
  useAssignVehicleMutation,
  useRemoveVehicleMutation,
  useAssignPlantMutation,
  useRemovePlantMutation,
  useAssignEmployeeMutation,
  useRemoveEmployeeMutation,
  useGetNextProjectCodeQuery,
  useGetProjectSummaryQuery,
  useGetProjectSalaryExpenseQuery,
  useGetProjectPayrollQuery,
} = projectApi;
