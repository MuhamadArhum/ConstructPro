export interface EmployeeDto {
  id: string;
  code?: string;
  fullName: string;
  designation?: string;
  department?: string;
  phoneNumber?: string;
  cnic?: string;
  address?: string;
  basicSalary: number;
  joinDate: string;
  isActive: boolean;
  createdAt?: string;
}

export interface SalaryPaymentDto {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  daysPresent: number;
  totalDays: number;
  remarks?: string;
  paidAt: string;
}

export interface EmployeeAdvanceDto {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  reason?: string | null;
  isDeducted: boolean;
  deductedAt?: string | null;
  createdAt: string;
}

export interface PendingAdvancesDto {
  advances: EmployeeAdvanceDto[];
  total: number;
}

export interface CreateEmployeeRequest {
  fullName: string;
  designation?: string;
  department?: string;
  phoneNumber?: string;
  cnic?: string;
  address?: string;
  basicSalary: number;
  joinDate: string;
}

export interface UpdateEmployeeRequest extends CreateEmployeeRequest {}

export interface ProcessSalaryRequest {
  month: number;
  year: number;
  basicSalary: number;
  bonus: number;
  deductions: number;
  daysPresent: number;
  totalDays: number;
  remarks?: string;
}
