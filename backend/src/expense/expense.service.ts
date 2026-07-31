import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseQueryDto } from './dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ExpenseQueryDto, userId?: string) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.fromDate || query.toDate) {
      where.date = {};
      if (query.fromDate) {
        where.date.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.date.lte = new Date(query.toDate + 'T23:59:59');
      }
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { vendor: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: expenses.map((e) => this.mapExpense(e)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException(`Expense record with id ${id} not found`);
    }

    return this.mapExpense(expense);
  }

  async create(dto: CreateExpenseDto, userId?: string) {
    const expense = await this.prisma.expense.create({
      data: {
        category: dto.category,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        vendor: dto.vendor,
        createdById: userId ?? null,
      },
    });

    return this.mapExpense(expense);
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findById(id);

    const data: any = {};

    if (dto.category !== undefined) data.category = dto.category;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.vendor !== undefined) data.vendor = dto.vendor;

    const expense = await this.prisma.expense.update({
      where: { id },
      data,
    });

    return this.mapExpense(expense);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Expense record deleted successfully' };
  }

  async getSummary() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allExpenses, thisMonthResult] = await Promise.all([
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfThisMonth } },
      }),
    ]);

    return {
      totalAllTime: Number(allExpenses._sum.amount ?? 0),
      totalThisMonth: Number(thisMonthResult._sum.amount ?? 0),
    };
  }

  private mapExpense(expense: any) {
    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }
}
