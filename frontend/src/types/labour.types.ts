export interface LabourDto {
  id: string;
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
  labourName: string;
  amount: number;
  date: string;
  reason?: string;
}

export interface LabourLedgerDto {
  labour: LabourDto;
  totalEarnings: number;
  totalAdvances: number;
  netPayable: number;
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
