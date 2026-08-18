export interface LabourDto {
  id: string;
  code?: string;
  name: string;
  phoneNumber?: string;
  cnic?: string;
  address?: string;
  trade?: string;
  dailyWage: number;
  overtimeRatePerHour: number;
  joinDate: string;
  isActive: boolean;
  totalAdvances: number;
}

export interface LabourAttendanceDto {
  id: string;
  labourId: string;
  labourName: string;
  date: string;
  isPresent: boolean;
  overtimeHours: number;
  notes?: string;
  dailyWage: number;
  overtimePay: number;
  totalPay: number;
}

export interface LabourAdvanceDto {
  id: string;
  labourId: string;
  labourName?: string;
  amount: number;
  date: string;
  reason?: string;
}

export interface LabourLedgerSummary {
  presentDays: number;
  totalOvertimeHours: number;
  wagesEarned: number;
  overtimePay: number;
  totalAdvances: number;
  netPayable: number;
}

export interface LabourLedgerDto {
  labour: LabourDto;
  period: { month: number; year: number };
  summary: LabourLedgerSummary;
  attendances: LabourAttendanceDto[];
  advances: LabourAdvanceDto[];
}

export interface LabourSummaryDto {
  totalActive: number;
  totalInactive: number;
  totalDailyWageBill: number;
  totalPendingAdvances: number;
}

export interface LabourAttendanceByDateItem {
  labourId: string;
  labourName: string;
  labourCode: string | null;
  trade: string | null;
  dailyWage: number;
  overtimeRatePerHour: number;
  attendance: {
    id: string;
    isPresent: boolean;
    overtimeHours: number;
    notes: string | null;
  } | null;
}

export interface LabourPayrollSummaryItem {
  labourId: string;
  labourCode: string | null;
  name: string;
  trade: string | null;
  presentDays: number;
  wagesEarned: number;
  overtimePay: number;
  totalAdvances: number;
  netPayable: number;
}

export interface LabourProjectAssignment {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string | null;
  projectStatus: string;
  assignedAt: string;
}

export interface CreateLabourRequest {
  code?: string;
  name: string;
  phoneNumber?: string;
  cnic?: string;
  address?: string;
  trade?: string;
  dailyWage: number;
  overtimeRatePerHour: number;
  joinDate: string;
}

export interface UpdateLabourRequest extends Partial<CreateLabourRequest> {
  isActive?: boolean;
}

export interface UpsertAttendanceRequest {
  labourId: string;
  date: string;
  isPresent: boolean;
  overtimeHours: number;
  notes?: string;
}

export interface AddAdvanceRequest {
  amount: number;
  date: string;
  reason?: string;
}

export interface AssignLabourToProjectRequest {
  projectId: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}
