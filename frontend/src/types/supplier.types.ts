export interface SupplierDto {
  id: string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  ntn?: string;
  category?: string;
  totalPurchased: number;
  totalPaid: number;
  outstandingBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  ntn?: string;
  category?: string;
  totalPurchased: number;
  totalPaid: number;
  isActive: boolean;
  notes?: string;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {}

export interface SupplierQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}
