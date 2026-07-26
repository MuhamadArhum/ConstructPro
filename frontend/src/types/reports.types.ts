export interface MonthlyReportItem {
  year: number;
  month: number;
  monthName: string;
  income: number;
  expense: number;
  profit: number;
}

export interface IncomeExpenseReportDto {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  monthly: MonthlyReportItem[];
}

export interface LabourReportDto {
  totalLabour: number;
  totalWagesPaid: number;
  totalAdvancesPaid: number;
  totalOvertimePaid: number;
}

export interface LowStockItem {
  name: string;
  currentStock: number;
  threshold: number;
  unit?: string;
}

export interface InventoryReportDto {
  totalItems: number;
  lowStockItems: number;
  totalStockValue: number;
  lowStockList: LowStockItem[];
}

export interface TaxBreakdownItem {
  taxType: string;
  amount: number;
  isPaid: boolean;
}

export interface TaxReportDto {
  totalTax: number;
  totalPaid: number;
  totalPending: number;
  byType: TaxBreakdownItem[];
}

export interface ReportQuery {
  fromDate?: string;
  toDate?: string;
}
