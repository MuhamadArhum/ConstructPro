export interface ReportQuery {
  fromDate?: string;
  toDate?: string;
}

// ── Income & Expense ─────────────────────────────────────────────────────────

export interface MonthlyReportItem {
  year: number;
  month: number;
  monthName: string;
  income: number;
  expense: number;
  profit: number;
}

export interface IncomeRow {
  id: string;
  date: string;
  category: string;
  description?: string | null;
  amount: number;
  reference?: string | null;
}

export interface ExpenseRow {
  id: string;
  date: string;
  category: string;
  description?: string | null;
  amount: number;
  reference?: string | null;
}

export interface CategoryBreakdown {
  category: string;
  totalIncome: number;
  totalExpense: number;
}

export interface IncomeExpenseReportDto {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  monthly: MonthlyReportItem[];
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  byCategory: CategoryBreakdown[];
}

// ── Labour ───────────────────────────────────────────────────────────────────

export interface LabourReportRow {
  id: string;
  name: string;
  trade?: string | null;
  dailyWage: number;
  presentDays: number;
  absentDays: number;
  totalWages: number;
  totalAdvances: number;
  netPayable: number;
}

export interface LabourReportDto {
  totalLabour: number;
  activeLabour: number;
  totalWages: number;
  totalAdvances: number;
  labours: LabourReportRow[];
}

// ── Inventory ────────────────────────────────────────────────────────────────

export interface LowStockItem {
  name: string;
  currentStock: number;
  threshold: number;
  unit?: string | null;
}

export interface InventoryReportItem {
  id: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  currentStock: number;
  lowStockThreshold: number;
  unitPrice: number;
  totalValue: number;
  supplierName?: string | null;
  location?: string | null;
  isLowStock: boolean;
}

export interface InventoryReportDto {
  totalItems: number;
  lowStockItems: number;
  totalStockValue: number;
  lowStockList: LowStockItem[];
  items: InventoryReportItem[];
}

// ── Tax ──────────────────────────────────────────────────────────────────────

export interface TaxRecordRow {
  id: string;
  taxType: string;
  amount: number;
  periodStart: string;
  periodEnd?: string | null;
  dueDate?: string | null;
  isPaid: boolean;
  notes?: string | null;
}

export interface TaxReportDto {
  totalTax: number;
  totalPaid: number;
  totalPending: number;
  overdueTax: number;
  records: TaxRecordRow[];
}

// ── Customers ────────────────────────────────────────────────────────────────

export interface CustomerReportRow {
  id: string;
  name: string;
  companyName?: string | null;
  phone?: string | null;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface CustomerReportDto {
  totalCustomers: number;
  activeCustomers: number;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  customers: CustomerReportRow[];
}

// ── Suppliers ────────────────────────────────────────────────────────────────

export interface SupplierReportRow {
  id: string;
  name: string;
  companyName?: string | null;
  phone?: string | null;
  totalPurchased: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface SupplierReportDto {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPurchased: number;
  totalPaid: number;
  totalOutstanding: number;
  suppliers: SupplierReportRow[];
}

// ── Employees ────────────────────────────────────────────────────────────────

export interface EmployeeReportRow {
  id: string;
  name: string;
  designation?: string | null;
  department?: string | null;
  salary: number;
  isActive: boolean;
  salaryPaidCount: number;
  totalSalaryPaid: number;
}

export interface EmployeeReportDto {
  totalEmployees: number;
  activeEmployees: number;
  totalSalaryPaid: number;
  employees: EmployeeReportRow[];
}

// ── Machinery ────────────────────────────────────────────────────────────────

export interface MachineryReportRow {
  id: string;
  name: string;
  type?: string | null;
  model?: string | null;
  status: string;
  maintenanceCount: number;
  totalMaintenanceCost: number;
  lastMaintenanceDate?: string | null;
}

export interface MachineryReportDto {
  totalMachinery: number;
  activeMachinery: number;
  totalMaintenanceCost: number;
  machinery: MachineryReportRow[];
}

// ── Vehicles ─────────────────────────────────────────────────────────────────

export interface VehicleReportRow {
  id: string;
  name: string;
  type?: string | null;
  model?: string | null;
  status: string;
  maintenanceCount: number;
  totalMaintenanceCost: number;
  lastMaintenanceDate?: string | null;
}

export interface VehicleReportDto {
  totalVehicles: number;
  activeVehicles: number;
  totalMaintenanceCost: number;
  vehicles: VehicleReportRow[];
}
