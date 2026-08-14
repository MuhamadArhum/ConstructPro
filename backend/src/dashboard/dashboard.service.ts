import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
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
        select: {
          id: true,
          category: true,
          amount: true,
          date: true,
          description: true,
        },
      }),
      this.prisma.expense.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          category: true,
          amount: true,
          date: true,
          description: true,
        },
      }),
    ]);

    const totalIncomeAllTime = Number(totalIncomeResult._sum.amount ?? 0);
    const totalExpenseAllTime = Number(totalExpenseResult._sum.amount ?? 0);
    const profitLossAllTime = totalIncomeAllTime - totalExpenseAllTime;
    const totalIncomeThisMonth = Number(thisMonthIncomeResult._sum.amount ?? 0);
    const totalExpenseThisMonth = Number(
      thisMonthExpenseResult._sum.amount ?? 0,
    );
    const profitLossThisMonth = totalIncomeThisMonth - totalExpenseThisMonth;
    const pendingPayments = Number(pendingPaymentsResult._sum.amount ?? 0);

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

  async getDashboardData() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Core queries — always available
    const [
      incomeThisMonthResult,
      expenseThisMonthResult,
      customerAgg,
      supplierAgg,
      recentIncomes,
      recentExpenses,
    ] = await Promise.all([
      this.prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd } } }),
      this.prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd } } }),
      this.prisma.customer.aggregate({ _sum: { totalBilled: true, totalPaid: true } }),
      this.prisma.supplier.aggregate({ _sum: { totalPurchased: true, totalPaid: true } }),
      this.prisma.income.findMany({ take: 10, orderBy: { date: 'desc' }, select: { id: true, category: true, amount: true, date: true, description: true } }),
      this.prisma.expense.findMany({ take: 10, orderBy: { date: 'desc' }, select: { id: true, category: true, amount: true, date: true, description: true } }),
    ]);

    // Optional queries — new tables may not exist in older deployments
    const [
      activeProjectsCount,
      activeProjects,
      unpaidInvoicesResult,
      pendingPOCount,
      lowStockCount,
      lowStockAlerts,
    ] = await Promise.all([
      this.prisma.project.count({ where: { status: { in: ['Planning', 'Active', 'On Hold'] } } }).catch(() => 0),
      this.prisma.project.findMany({ where: { status: { not: 'Completed' } }, orderBy: { startDate: 'desc' }, take: 5, include: { client: { select: { name: true } } } }).catch(() => []),
      this.prisma.invoice.aggregate({ _sum: { total: true }, _count: { id: true }, where: { status: { not: 'Paid' } } }).catch(() => ({ _sum: { total: 0 }, _count: { id: 0 } })),
      this.prisma.purchaseOrder.count({ where: { status: { in: ['Draft', 'Sent', 'Approved'] } } }).catch(() => 0),
      this.prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM inventory_items WHERE current_stock <= low_stock_threshold`.catch(() => [{ count: BigInt(0) }]),
      this.prisma.$queryRaw<Array<{ id: string; name: string; current_stock: any; low_stock_threshold: any; unit: string | null }>>`SELECT id, name, current_stock, low_stock_threshold, unit FROM inventory_items WHERE current_stock <= low_stock_threshold ORDER BY current_stock ASC LIMIT 5`.catch(() => []),
    ]);

    const totalIncomeThisMonth = Number(incomeThisMonthResult._sum.amount ?? 0);
    const totalExpenseThisMonth = Number(expenseThisMonthResult._sum.amount ?? 0);
    const customerOutstanding = Number(customerAgg._sum.totalBilled ?? 0) - Number(customerAgg._sum.totalPaid ?? 0);
    const supplierOutstanding = Number(supplierAgg._sum.totalPurchased ?? 0) - Number(supplierAgg._sum.totalPaid ?? 0);

    const chart = await this.buildChartData(now);

    const recentTransactions = [
      ...recentIncomes.map((r) => ({ id: r.id, type: 'income' as const, category: r.category as string, amount: Number(r.amount), date: r.date, description: r.description ?? null })),
      ...recentExpenses.map((r) => ({ id: r.id, type: 'expense' as const, category: r.category as string, amount: Number(r.amount), date: r.date, description: r.description ?? null })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      thisMonth: { income: totalIncomeThisMonth, expense: totalExpenseThisMonth, profit: totalIncomeThisMonth - totalExpenseThisMonth },
      activeProjectsCount,
      customerOutstanding,
      supplierOutstanding,
      lowStockCount: Number((lowStockCount as any)[0]?.count ?? 0),
      unpaidInvoicesCount: (unpaidInvoicesResult as any)._count?.id ?? 0,
      unpaidInvoicesTotal: Number((unpaidInvoicesResult as any)._sum?.total ?? 0),
      pendingPOCount,
      chart,
      activeProjects: (activeProjects as any[]).map((p) => ({
        id: p.id, name: p.name, status: p.status, progress: p.progress,
        budget: Number(p.budget), spent: Number(p.spent),
        clientName: p.client?.name ?? null, endDate: p.endDate ?? null,
      })),
      lowStockAlerts: (lowStockAlerts as any[]).map((i) => ({
        id: i.id, name: i.name, currentStock: Number(i.current_stock),
        lowStockThreshold: Number(i.low_stock_threshold), unit: i.unit,
      })),
      recentTransactions,
    };
  }

  private async buildChartData(now: Date) {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        d,
        year: d.getFullYear(),
        month: d.getMonth(),
        monthName: d.toLocaleString('en-US', { month: 'long' }),
        monthStart: new Date(d.getFullYear(), d.getMonth(), 1),
        monthEnd: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      };
    });

    const results = await Promise.all(
      months.flatMap(({ monthStart, monthEnd }) => [
        this.prisma.income.aggregate({
          _sum: { amount: true },
          where: { date: { gte: monthStart, lte: monthEnd } },
        }),
        this.prisma.expense.aggregate({
          _sum: { amount: true },
          where: { date: { gte: monthStart, lte: monthEnd } },
        }),
      ]),
    );

    return months.map(({ year, month, monthName }, i) => ({
      monthName,
      year,
      month: month + 1,
      income: Number(results[i * 2]._sum.amount ?? 0),
      expense: Number(results[i * 2 + 1]._sum.amount ?? 0),
    }));
  }
}
