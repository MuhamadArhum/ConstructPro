export type IncomeCategory = string;

export interface IncomeDto {
  id: string;
  code?: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  customerName?: string;
  projectName?: string;
  receiptPath?: string;
  isPaid: boolean;
  createdAt: string;
}

export interface IncomeSummaryDto {
  totalAllTime: number;
  totalThisMonth: number;
  totalPaid: number;
  totalPending: number;
}

export interface CreateIncomeRequest {
  code?: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  customerName?: string;
  projectName?: string;
  isPaid: boolean;
}

export interface UpdateIncomeRequest extends CreateIncomeRequest {}

export interface IncomeQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
  amountMin?: number;
  amountMax?: number;
}
