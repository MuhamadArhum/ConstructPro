export type VehicleStatus = 'Active' | 'UnderMaintenance' | 'Retired';

export interface VehicleDto {
  id: string;
  registrationNumber: string;
  make: string;
  model?: string;
  year?: number;
  driverName?: string;
  driverContact?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  status: VehicleStatus;
  statusDisplay: string;
  totalMileage: number;
  nextMaintenanceDate?: string;
  notes?: string;
  createdAt: string;
  maintenanceCount: number;
}

export interface VehicleMaintenanceDto {
  id: string;
  vehicleId: string;
  maintenanceDate: string;
  description: string;
  cost: number;
  serviceProvider?: string;
  nextDueDate?: string;
  mileageAtService?: number;
  notes?: string;
  createdAt: string;
}

export interface CreateVehicleRequest {
  registrationNumber: string;
  make: string;
  model?: string;
  year?: number;
  driverName?: string;
  driverContact?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  status: VehicleStatus;
  notes?: string;
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {
  totalMileage: number;
  nextMaintenanceDate?: string;
}

export interface CreateVehicleMaintenanceRequest {
  maintenanceDate: string;
  description: string;
  cost: number;
  serviceProvider?: string;
  nextDueDate?: string;
  mileageAtService?: number;
  notes?: string;
}

export interface VehicleQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}
