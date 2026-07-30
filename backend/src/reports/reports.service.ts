import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getIncomeExpenseReport(startDate?: string, endDate?: string) {
    const incomeWhere: any = {};
    const expenseWhere: any = {};

    if (startDate || endDate) {
      incomeWhere.date = {};
      expenseWhere.date = {};
      if (startDate) {
        incomeWhere.date.gte = new Date(startDate);
        expenseWhere.date.gte = new Date(startDate);
      }
      if (endDate) {
        incomeWhere.date.lte = new Date(endDate);
        expenseWhere.date.lte = new Date(endDate);
      }
    }

    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany({
        where: incomeWhere,
        select: { amount: true, date: true },
      }),
      this.prisma.expense.findMany({
        where: expenseWhere,
        select: { amount: true, date: true },
      }),
    ]);

    // Group by year-month
    const monthMap = new Map<string, { month: number; year: number; income: number; expense: number }>();

    for (const income of incomes) {
      const d = new Date(income.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { month: d.getMonth() + 1, year: d.getFullYear(), income: 0, expense: 0 });
      }
      const entry = monthMap.get(key)!;
      entry.income += Number(income.amount);
    }

    for (const expense of expenses) {
      const d = new Date(expense.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { month: d.getMonth() + 1, year: d.getFullYear(), income: 0, expense: 0 });
      }
      const entry = monthMap.get(key)!;
      entry.expense += Number(expense.amount);
    }

    const monthly = Array.from(monthMap.values())
      .map((entry) => ({
        month: entry.month,
        year: entry.year,
        income: entry.income,
        expense: entry.expense,
        profit: entry.income - entry.expense,
      }))
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    const totalIncome = monthly.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = monthly.reduce((sum, m) => sum + m.expense, 0);
    const totalProfit = totalIncome - totalExpense;

    return {
      monthly,
      totals: { totalIncome, totalExpense, totalProfit },
    };
  }

  async getLabourReport(startDate?: string, endDate?: string) {
    const attendanceWhere: any = {};

    if (startDate || endDate) {
      attendanceWhere.date = {};
      if (startDate) attendanceWhere.date.gte = new Date(startDate);
      if (endDate) attendanceWhere.date.lte = new Date(endDate);
    }

    const labours = await this.prisma.labour.findMany({
      include: {
        attendances: {
          where: attendanceWhere,
        },
        advances: {
          where:
            startDate || endDate
              ? {
                  date: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {}),
                  },
                }
              : {},
        },
      },
    });

    const totalLabours = labours.length;
    const activeLabours = labours.filter((l) => l.isActive).length;

    let totalAdvancesSum = 0;

    const labourData = labours.map((labour) => {
      const presentDays = labour.attendances.filter((a) => a.isPresent).length;
      const dailyWage = Number(labour.dailyWage);
      const totalWages = presentDays * dailyWage;
      const totalAdvances = labour.advances.reduce((sum, a) => sum + Number(a.amount), 0);
      const netPayable = totalWages - totalAdvances;

      totalAdvancesSum += totalAdvances;

      return {
        id: labour.id,
        name: labour.name,
        trade: labour.trade,
        dailyWage,
        presentDays,
        totalWages,
        totalAdvances,
        netPayable,
      };
    });

    return {
      totalLabours,
      activeLabours,
      totalAdvances: totalAdvancesSum,
      labours: labourData,
    };
  }

  async getInventoryReport() {
    const items = await this.prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });

    const totalItems = items.length;
    let lowStockItems = 0;
    let totalValue = 0;

    const mappedItems = items.map((item) => {
      const currentStock = Number(item.currentStock);
      const lowStockThreshold = Number(item.lowStockThreshold);
      const unitPrice = Number(item.unitPrice);
      const itemValue = currentStock * unitPrice;

      if (currentStock <= lowStockThreshold) {
        lowStockItems++;
      }
      totalValue += itemValue;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock,
        lowStockThreshold,
        unitPrice,
        itemValue,
        supplierName: item.supplierName,
        location: item.location,
        isLowStock: currentStock <= lowStockThreshold,
        createdAt: item.createdAt,
      };
    });

    return {
      totalItems,
      lowStockItems,
      totalValue,
      items: mappedItems,
    };
  }

  async getTaxReport(startDate?: string, endDate?: string) {
    const where: any = {};
    const now = new Date();

    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) where.periodStart.gte = new Date(startDate);
      if (endDate) where.periodStart.lte = new Date(endDate);
    }

    const records = await this.prisma.taxRecord.findMany({
      where,
      orderBy: { periodStart: 'desc' },
    });

    let totalTax = 0;
    let paidTax = 0;
    let unpaidTax = 0;
    let overdueTax = 0;

    const mappedRecords = records.map((record) => {
      const amount = Number(record.amount);
      totalTax += amount;

      if (record.isPaid) {
        paidTax += amount;
      } else {
        unpaidTax += amount;
        if (record.dueDate && record.dueDate < now) {
          overdueTax += amount;
        }
      }

      return {
        ...record,
        amount,
      };
    });

    return {
      totalTax,
      paidTax,
      unpaidTax,
      overdueTax,
      records: mappedRecords,
    };
  }
}
