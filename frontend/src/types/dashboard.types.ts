export interface MonthlyChartDataDto {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export interface RecentTransactionDto {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface DashboardStatsDto {
  totalIncomeAllTime: number;
  totalExpenseAllTime: number;
  profitLossAllTime: number;
  totalIncomeThisMonth: number;
  totalExpenseThisMonth: number;
  profitLossThisMonth: number;
  pendingPayments: number;
  activeLabourCount: number;
  activeEmployeeCount: number;
  activeMachineryCount: number;
  maintenanceDueCount: number;
  monthlyChart: MonthlyChartDataDto[];
  recentTransactions: RecentTransactionDto[];
}
