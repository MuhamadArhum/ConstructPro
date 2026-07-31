export interface DashboardThisMonth {
  income: number;
  expense: number;
  profit: number;
}

export interface DashboardChartPoint {
  monthName: string;
  year: number;
  month: number;
  income: number;
  expense: number;
}

export interface DashboardActiveProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  clientName?: string;
  endDate?: string;
}

export interface DashboardLowStockAlert {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  unit?: string;
}

export interface DashboardRecentTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description?: string;
}

export interface DashboardDto {
  thisMonth: DashboardThisMonth;
  activeProjectsCount: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  lowStockCount: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;
  pendingPOCount: number;
  chart: DashboardChartPoint[];
  activeProjects: DashboardActiveProject[];
  lowStockAlerts: DashboardLowStockAlert[];
  recentTransactions: DashboardRecentTransaction[];
}
