import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Build last-6-months date range
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalIncomeResult,
      totalExpenseResult,
      thisMonthIncomeResult,
      thisMonthExpenseResult,
      pendingPaymentsResult,
      activeEmployeeCount,
      activeLabourCount,
      activeMachineryCount,
      maintenanceDueCount,
      last6MonthsIncomes,
      last6MonthsExpenses,
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
      this.prisma.income.aggregate({
        _sum: { amount: true },
        where: { isPaid: false },
      }),
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.labour.count({ where: { isActive: true } }),
      this.prisma.machinery.count({ where: { status: 'Active' as any } }),
      this.prisma.machinery.count({
        where: {
          status: 'Active' as any,
          nextMaintenanceDate: { lte: sevenDaysFromNow },
        },
      }),
      this.prisma.income.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true },
      }),
      this.prisma.expense.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true },
      }),
      this.prisma.income.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, category: true, amount: true, date: true, description: true },
      }),
      this.prisma.expense.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, category: true, amount: true, date: true, description: true },
      }),
    ]);

    const totalIncomeAllTime = Number(totalIncomeResult._sum.amount ?? 0);
    const totalExpenseAllTime = Number(totalExpenseResult._sum.amount ?? 0);
    const profitLossAllTime = totalIncomeAllTime - totalExpenseAllTime;
    const totalIncomeThisMonth = Number(thisMonthIncomeResult._sum.amount ?? 0);
    const totalExpenseThisMonth = Number(thisMonthExpenseResult._sum.amount ?? 0);
    const profitLossThisMonth = totalIncomeThisMonth - totalExpenseThisMonth;
    const pendingPayments = Number(pendingPaymentsResult._sum.amount ?? 0);

    // Build monthly chart for last 6 months
    const monthlyChart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthName = d.toLocaleString('en-US', { month: 'long' });

      const income = last6MonthsIncomes
        .filter((r) => {
          const rd = new Date(r.date);
          return rd.getFullYear() === year && rd.getMonth() === month;
        })
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const expense = last6MonthsExpenses
        .filter((r) => {
          const rd = new Date(r.date);
          return rd.getFullYear() === year && rd.getMonth() === month;
        })
        .reduce((sum, r) => sum + Number(r.amount), 0);

      return { month: monthName, income, expense, profit: income - expense };
    });

    // Merge & sort recent transactions
    const recentTransactions = [
      ...recentIncomes.map((r) => ({
        id: r.id,
        type: 'Income',
        category: r.category as string,
        amount: Number(r.amount),
        date: r.date.toISOString(),
        description: r.description ?? '',
      })),
      ...recentExpenses.map((r) => ({
        id: r.id,
        type: 'Expense',
        category: r.category as string,
        amount: Number(r.amount),
        date: r.date.toISOString(),
        description: r.description ?? '',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalIncomeAllTime,
      totalExpenseAllTime,
      profitLossAllTime,
      totalIncomeThisMonth,
      totalExpenseThisMonth,
      profitLossThisMonth,
      pendingPayments,
      activeEmployeeCount,
      activeLabourCount,
      activeMachineryCount,
      maintenanceDueCount,
      monthlyChart,
      recentTransactions,
    };
  }
}
