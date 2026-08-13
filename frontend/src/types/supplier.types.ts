export interface SupplierDto {
  id: string;
  code?: string;
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

export type SupplierTransactionType = 'PURCHASE' | 'PAYMENT';

export interface SupplierTransactionDto {
  id: string;
  date: string;
  type: SupplierTransactionType;
  description?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
  createdAt: string;
}

export interface SupplierLedgerResponse {
  supplier: {
    id: string;
    name: string;
    companyName?: string;
    phone?: string;
    totalPurchased: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  transactions: SupplierTransactionDto[];
  summary: { totalDebit: number; totalCredit: number; closingBalance: number };
}

export interface CreateSupplierTransactionRequest {
  type: SupplierTransactionType;
  amount: number;
  date: string;
  description?: string;
  reference?: string;
}
