export interface LabourDto {
  id: string;
  code?: string;
  name: string;
  phoneNumber?: string;
  cnic?: string;
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
  amount: number;
  date: string;
  reason?: string;
  isDeducted: boolean;
  deductedAt?: string | null;
  createdAt: string;
}

export interface PendingLabourAdvancesDto {
  advances: LabourAdvanceDto[];
  total: number;
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

export interface CreateLabourRequest {
  name: string;
  phoneNumber?: string;
  cnic?: string;
  trade?: string;
  dailyWage: number;
  overtimeRatePerHour: number;
  joinDate: string;
}

export interface UpdateLabourRequest extends CreateLabourRequest {}

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

export interface LabourWagePaymentDto {
  id: string;
  labourId: string;
  month: number;
  year: number;
  daysPresent: number;
  wagesEarned: number;
  overtimePay: number;
  advanceDeductions: number;
  netPayable: number;
  status: 'Generated' | 'Paid';
  paidDate?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface SettleWagesRequest {
  month: number;
  year: number;
  remarks?: string;
}

export interface MarkWagePaidRequest {
  paidDate: string;
}
