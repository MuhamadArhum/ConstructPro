export interface CustomerDto {
  id: string;
  code?: string;
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

export type CustomerTransactionType = 'INVOICE' | 'PAYMENT';

export interface CustomerTransactionDto {
  id: string;
  date: string;
  type: CustomerTransactionType;
  description?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
  createdAt: string;
}

export interface CustomerLedgerResponse {
  customer: {
    id: string;
    name: string;
    companyName?: string;
    phone?: string;
    totalBilled: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  transactions: CustomerTransactionDto[];
  summary: { totalDebit: number; totalCredit: number; closingBalance: number };
}

export interface CreateCustomerTransactionRequest {
  type: CustomerTransactionType;
  amount: number;
  date: string;
  description?: string;
  reference?: string;
}
