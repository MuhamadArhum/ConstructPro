export interface CustomerDto {
  id: string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  ntn?: string;
  cnic?: string;
  projectName?: string;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  ntn?: string;
  cnic?: string;
  projectName?: string;
  totalBilled: number;
  totalPaid: number;
  isActive: boolean;
  notes?: string;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {}

export interface CustomerQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}
