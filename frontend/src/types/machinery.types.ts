export type MachineryStatus = 'Active' | 'UnderMaintenance' | 'Retired';
export type MaintenanceType = 'Scheduled' | 'Repair';

export interface MachineryDto {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  status: MachineryStatus;
  statusDisplay: string;
  totalRunningHours: number;
  nextMaintenanceDate?: string;
  isMaintenanceDue: boolean;
  notes?: string;
  createdAt: string;
}

export interface MachineryMaintenanceDto {
  id: string;
  machineryId: string;
  machineryName: string;
  maintenanceDate: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  runningHoursAtService?: number;
  nextMaintenanceDate?: string;
  serviceProvider?: string;
}

export interface CreateMachineryRequest {
  name: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  totalRunningHours: number;
  nextMaintenanceDate?: string;
  notes?: string;
}

export interface UpdateMachineryRequest extends CreateMachineryRequest {}

export interface AddMaintenanceRequest {
  maintenanceDate: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  runningHoursAtService?: number;
  nextMaintenanceDate?: string;
  serviceProvider?: string;
}
