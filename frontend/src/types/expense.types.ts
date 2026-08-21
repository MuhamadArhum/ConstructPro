export type ExpenseCategory = string;

export interface ExpenseDto {
  id: string;
  code?: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  vendor?: string;
  billPath?: string;
  createdAt: string;
}

export interface ExpenseSummaryDto {
  totalAllTime: number;
  totalThisMonth: number;
}

export interface CreateExpenseRequest {
  code?: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  vendor?: string;
}

export interface UpdateExpenseRequest extends CreateExpenseRequest {}

export interface ExpenseQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
  amountMin?: number;
  amountMax?: number;
}
