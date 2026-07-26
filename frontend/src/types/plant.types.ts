export type PlantStatus = 'Active' | 'UnderMaintenance' | 'Disposed';

export interface PlantDto {
  id: string;
  name: string;
  type?: string;
  manufacturer?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  status: PlantStatus;
  statusDisplay: string;
  location?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePlantRequest {
  name: string;
  type?: string;
  manufacturer?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  status: PlantStatus;
  location?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

export interface UpdatePlantRequest extends CreatePlantRequest {}

export interface PlantQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}
