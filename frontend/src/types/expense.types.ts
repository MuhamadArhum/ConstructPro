export type ExpenseCategory =
  | 'LabourExpenses'
  | 'Salaries'
  | 'MachineryMaintenance'
  | 'VehicleExpenses'
  | 'Fuel'
  | 'PlantExpenses'
  | 'CarpentryExpenses'
  | 'ElectricalExpenses'
  | 'SuppliesMaterialPurchase'
  | 'OfficeExpenses'
  | 'Miscellaneous';

export interface ExpenseDto {
  id: string;
  code?: string;
  category: ExpenseCategory;
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
  category: ExpenseCategory;
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
