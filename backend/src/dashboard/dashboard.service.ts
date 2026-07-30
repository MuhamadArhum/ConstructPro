import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalIncomeResult,
      totalExpenseResult,
      thisMonthIncomeResult,
      thisMonthExpenseResult,
      totalEmployees,
      totalLabours,
      totalCustomers,
      totalSuppliers,
      inventoryItems,
      machineryDueForMaintenance,
      recentIncomes,
      recentExpenses,
    ] = await Promise.all([
      this.prisma.income.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.income.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfMonth } },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfMonth } },
      }),
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.labour.count({ where: { isActive: true } }),
      this.prisma.customer.count({ where: { isActive: true } }),
      this.prisma.supplier.count({ where: { isActive: true } }),
      this.prisma.inventoryItem.findMany({
        select: { currentStock: true, lowStockThreshold: true },
      }),
      this.prisma.machinery.count({
        where: {
          status: 'Active' as any,
          nextMaintenanceDate: {
            lte: sevenDaysFromNow,
          },
        },
      }),
      this.prisma.income.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalIncome = Number(totalIncomeResult._sum.amount ?? 0);
    const totalExpense = Number(totalExpenseResult._sum.amount ?? 0);
    const netProfit = totalIncome - totalExpense;
    const thisMonthIncome = Number(thisMonthIncomeResult._sum.amount ?? 0);
    const thisMonthExpense = Number(thisMonthExpenseResult._sum.amount ?? 0);

    const lowStockItems = inventoryItems.filter(
      (item) => Number(item.currentStock) <= Number(item.lowStockThreshold),
    ).length;

    return {
      totalIncome,
      totalExpense,
      netProfit,
      thisMonthIncome,
      thisMonthExpense,
      totalEmployees,
      totalLabours,
      totalCustomers,
      totalSuppliers,
      lowStockItems,
      machineryDueForMaintenance,
      recentIncomes: recentIncomes.map((i) => ({ ...i, amount: Number(i.amount) })),
      recentExpenses: recentExpenses.map((e) => ({ ...e, amount: Number(e.amount) })),
    };
  }
}
