import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getIncomeExpenseReport(fromDate?: string, toDate?: string) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const hasDateFilter = fromDate || toDate;

    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany({
        where: hasDateFilter ? { date: dateFilter } : {},
        orderBy: { date: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: hasDateFilter ? { date: dateFilter } : {},
        orderBy: { date: 'asc' },
      }),
    ]);

    // Monthly grouping
    const monthMap = new Map<
      string,
      { month: number; year: number; income: number; expense: number }
    >();

    for (const income of incomes) {
      const d = new Date(income.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          income: 0,
          expense: 0,
        });
      }
      monthMap.get(key)!.income += Number(income.amount);
    }

    for (const expense of expenses) {
      const d = new Date(expense.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          income: 0,
          expense: 0,
        });
      }
      monthMap.get(key)!.expense += Number(expense.amount);
    }

    const monthly = Array.from(monthMap.values())
      .map((entry) => ({
        month: entry.month,
        year: entry.year,
        monthName: new Date(entry.year, entry.month - 1).toLocaleString('en-US', {
          month: 'long',
        }),
        income: entry.income,
        expense: entry.expense,
        profit: entry.income - entry.expense,
      }))
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));

    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalIncome - totalExpense;

    // Category breakdown
    const categoryMap = new Map<
      string,
      { category: string; totalIncome: number; totalExpense: number }
    >();

    for (const income of incomes) {
      const cat = income.category as string;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { category: cat, totalIncome: 0, totalExpense: 0 });
      }
      categoryMap.get(cat)!.totalIncome += Number(income.amount);
    }

    for (const expense of expenses) {
      const cat = expense.category as string;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { category: cat, totalIncome: 0, totalExpense: 0 });
      }
      categoryMap.get(cat)!.totalExpense += Number(expense.amount);
    }

    const byCategory = Array.from(categoryMap.values());

    const incomeRows = incomes.map((i) => ({
      id: i.id,
      date: i.date,
      category: i.category,
      description: i.description ?? null,
      amount: Number(i.amount),
      reference: i.customerName ?? i.projectName ?? null,
    }));

    const expenseRows = expenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description ?? null,
      amount: Number(e.amount),
      reference: e.vendor ?? null,
    }));

    return {
      totalIncome,
      totalExpense,
      netProfit,
      monthly,
      incomes: incomeRows,
      expenses: expenseRows,
      byCategory,
    };
  }

  async getLabourReport(fromDate?: string, toDate?: string) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);
    const hasDateFilter = fromDate || toDate;

    const labours = await this.prisma.labour.findMany({
      include: {
        attendances: hasDateFilter ? { where: { date: dateFilter } } : true,
        advances: hasDateFilter ? { where: { date: dateFilter } } : true,
      },
      orderBy: { name: 'asc' },
    });

    const totalLabour = labours.length;
    const activeLabour = labours.filter((l) => l.isActive).length;

    let totalWagesSum = 0;
    let totalAdvancesSum = 0;

    const labourRows = labours.map((labour) => {
      const presentDays = labour.attendances.filter((a) => a.isPresent).length;
      const absentDays = labour.attendances.filter((a) => !a.isPresent).length;
      const dailyWage = Number(labour.dailyWage);
      const totalWages = presentDays * dailyWage;
      const totalAdvances = labour.advances.reduce((sum, a) => sum + Number(a.amount), 0);
      const netPayable = totalWages - totalAdvances;

      totalWagesSum += totalWages;
      totalAdvancesSum += totalAdvances;

      return {
        id: labour.id,
        name: labour.name,
        trade: labour.trade ?? null,
        dailyWage,
        presentDays,
        absentDays,
        totalWages,
        totalAdvances,
        netPayable,
      };
    });

    return {
      totalLabour,
      activeLabour,
      totalWages: totalWagesSum,
      totalAdvances: totalAdvancesSum,
      labours: labourRows,
    };
  }

  async getInventoryReport() {
    const items = await this.prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });

    const totalItems = items.length;
    let lowStockItems = 0;
    let totalStockValue = 0;

    const mappedItems = items.map((item) => {
      const currentStock = Number(item.currentStock);
      const lowStockThreshold = Number(item.lowStockThreshold);
      const unitPrice = Number(item.unitPrice);
      const totalValue = currentStock * unitPrice;
      const isLowStock = currentStock <= lowStockThreshold;

      if (isLowStock) lowStockItems++;
      totalStockValue += totalValue;

      return {
        id: item.id,
        name: item.name,
        category: item.category ?? null,
        unit: item.unit ?? null,
        currentStock,
        lowStockThreshold,
        unitPrice,
        totalValue,
        supplierName: item.supplierName ?? null,
        location: item.location ?? null,
        isLowStock,
      };
    });

    const lowStockList = mappedItems
      .filter((i) => i.isLowStock)
      .map((i) => ({
        name: i.name,
        currentStock: i.currentStock,
        threshold: i.lowStockThreshold,
        unit: i.unit,
      }));

    return {
      totalItems,
      lowStockItems,
      totalStockValue,
      lowStockList,
      items: mappedItems,
    };
  }

  async getTaxReport(fromDate?: string, toDate?: string) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);
    const hasDateFilter = fromDate || toDate;

    const now = new Date();

    const records = await this.prisma.taxRecord.findMany({
      where: hasDateFilter ? { periodStart: dateFilter } : {},
      orderBy: { periodStart: 'desc' },
    });

    let totalTax = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let overdueTax = 0;

    const mappedRecords = records.map((record) => {
      const amount = Number(record.amount);
      totalTax += amount;

      if (record.isPaid) {
        totalPaid += amount;
      } else {
        totalPending += amount;
        if (record.dueDate && record.dueDate < now) {
          overdueTax += amount;
        }
      }

      return {
        id: record.id,
        taxType: record.taxType,
        amount,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd,
        dueDate: record.dueDate ?? null,
        isPaid: record.isPaid,
        notes: record.notes ?? null,
      };
    });

    return {
      totalTax,
      totalPaid,
      totalPending,
      overdueTax,
      records: mappedRecords,
    };
  }

  async getCustomerReport() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.isActive).length;

    let totalBilled = 0;
    let totalCollected = 0;

    const customerRows = customers.map((c) => {
      const billed = Number(c.totalBilled);
      const paid = Number(c.totalPaid);
      const outstandingBalance = billed - paid;

      totalBilled += billed;
      totalCollected += paid;

      return {
        id: c.id,
        name: c.name,
        companyName: c.companyName ?? null,
        phone: c.phone ?? null,
        totalBilled: billed,
        totalPaid: paid,
        outstandingBalance,
      };
    });

    customerRows.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    const totalOutstanding = totalBilled - totalCollected;

    return {
      totalCustomers,
      activeCustomers,
      totalBilled,
      totalCollected,
      totalOutstanding,
      customers: customerRows,
    };
  }

  async getSupplierReport() {
    const suppliers = await this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.isActive).length;

    let totalPurchased = 0;
    let totalPaid = 0;

    const supplierRows = suppliers.map((s) => {
      const purchased = Number(s.totalPurchased);
      const paid = Number(s.totalPaid);
      const outstandingBalance = purchased - paid;

      totalPurchased += purchased;
      totalPaid += paid;

      return {
        id: s.id,
        name: s.name,
        companyName: s.companyName ?? null,
        phone: s.phone ?? null,
        totalPurchased: purchased,
        totalPaid: paid,
        outstandingBalance,
      };
    });

    supplierRows.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    const totalOutstanding = totalPurchased - totalPaid;

    return {
      totalSuppliers,
      activeSuppliers,
      totalPurchased,
      totalPaid,
      totalOutstanding,
      suppliers: supplierRows,
    };
  }

  async getEmployeeReport() {
    const [employees, salaryAggregates] = await Promise.all([
      this.prisma.employee.findMany({
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.salaryPayment.groupBy({
        by: ['employeeId'],
        _sum: { netSalary: true },
        _count: { id: true },
      }),
    ]);

    const aggByEmployee = new Map(
      salaryAggregates.map((a) => [
        a.employeeId,
        { total: Number(a._sum.netSalary ?? 0), count: a._count.id },
      ]),
    );

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.isActive).length;
    let totalSalaryPaid = 0;

    const employeeRows = employees.map((emp) => {
      const agg = aggByEmployee.get(emp.id) ?? { total: 0, count: 0 };
      totalSalaryPaid += agg.total;
      return {
        id: emp.id,
        name: emp.fullName,
        designation: emp.designation ?? null,
        department: emp.department ?? null,
        salary: Number(emp.basicSalary),
        isActive: emp.isActive,
        salaryPaidCount: agg.count,
        totalSalaryPaid: agg.total,
      };
    });

    return {
      totalEmployees,
      activeEmployees,
      totalSalaryPaid,
      employees: employeeRows,
    };
  }

  async getMachineryReport(fromDate?: string, toDate?: string) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);
    const hasDateFilter = fromDate || toDate;

    const machineries = await this.prisma.machinery.findMany({
      include: {
        maintenanceRecords: hasDateFilter
          ? { where: { maintenanceDate: dateFilter } }
          : true,
      },
      orderBy: { name: 'asc' },
    });

    const totalMachinery = machineries.length;
    const activeMachinery = machineries.filter((m) => m.status === 'Active').length;
    let totalMaintenanceCost = 0;

    const machineryRows = machineries.map((m) => {
      const maintenanceCount = m.maintenanceRecords.length;
      const machineryMaintenanceCost = m.maintenanceRecords.reduce(
        (sum, r) => sum + Number(r.cost),
        0,
      );
      totalMaintenanceCost += machineryMaintenanceCost;

      const sortedRecords = [...m.maintenanceRecords].sort(
        (a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime(),
      );
      const lastMaintenanceDate = sortedRecords[0]?.maintenanceDate ?? null;

      return {
        id: m.id,
        name: m.name,
        model: m.model ?? null,
        status: m.status,
        maintenanceCount,
        totalMaintenanceCost: machineryMaintenanceCost,
        lastMaintenanceDate,
      };
    });

    return {
      totalMachinery,
      activeMachinery,
      totalMaintenanceCost,
      machinery: machineryRows,
    };
  }

  async getVehicleReport(fromDate?: string, toDate?: string) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);
    const hasDateFilter = fromDate || toDate;

    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        maintenanceRecords: hasDateFilter
          ? { where: { maintenanceDate: dateFilter } }
          : true,
      },
      orderBy: { registrationNumber: 'asc' },
    });

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.status === 'Active').length;
    let totalMaintenanceCost = 0;

    const vehicleRows = vehicles.map((v) => {
      const maintenanceCount = v.maintenanceRecords.length;
      const vehicleMaintenanceCost = v.maintenanceRecords.reduce(
        (sum, r) => sum + Number(r.cost),
        0,
      );
      totalMaintenanceCost += vehicleMaintenanceCost;

      const sortedRecords = [...v.maintenanceRecords].sort(
        (a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime(),
      );
      const lastMaintenanceDate = sortedRecords[0]?.maintenanceDate ?? null;

      return {
        id: v.id,
        name: v.registrationNumber,
        type: `${v.make ?? ''} ${v.model ?? ''}`.trim() || null,
        model: v.model ?? null,
        status: v.status,
        maintenanceCount,
        totalMaintenanceCost: vehicleMaintenanceCost,
        lastMaintenanceDate,
      };
    });

    return {
      totalVehicles,
      activeVehicles,
      totalMaintenanceCost,
      vehicles: vehicleRows,
    };
  }
}
