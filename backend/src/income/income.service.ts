import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto, UpdateIncomeDto, IncomeQueryDto } from './dto/income.dto';

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IncomeQueryDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { projectName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [incomes, total] = await Promise.all([
      this.prisma.income.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.income.count({ where }),
    ]);

    return {
      data: incomes.map((i) => this.mapIncome(i)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const income = await this.prisma.income.findUnique({ where: { id } });

    if (!income) {
      throw new NotFoundException(`Income record with id ${id} not found`);
    }

    return this.mapIncome(income);
  }

  async create(dto: CreateIncomeDto, userId?: string) {
    const income = await this.prisma.income.create({
      data: {
        category: dto.category,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        customerName: dto.customerName,
        projectName: dto.projectName,
        isPaid: dto.isPaid ?? true,
        createdById: userId ?? null,
      },
    });

    return this.mapIncome(income);
  }

  async update(id: string, dto: UpdateIncomeDto) {
    await this.findById(id);

    const data: any = {};

    if (dto.category !== undefined) data.category = dto.category;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.customerName !== undefined) data.customerName = dto.customerName;
    if (dto.projectName !== undefined) data.projectName = dto.projectName;
    if (dto.isPaid !== undefined) data.isPaid = dto.isPaid;

    const income = await this.prisma.income.update({
      where: { id },
      data,
    });

    return this.mapIncome(income);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.income.delete({ where: { id } });
    return { message: 'Income record deleted successfully' };
  }

  async getSummary() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [allIncomes, thisMonthResult, lastMonthResult, byCategoryResult] = await Promise.all([
      this.prisma.income.aggregate({ _sum: { amount: true } }),
      this.prisma.income.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfThisMonth } },
      }),
      this.prisma.income.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      this.prisma.income.groupBy({
        by: ['category'],
        _sum: { amount: true },
      }),
    ]);

    const byCategory = byCategoryResult.map((item) => ({
      category: item.category,
      total: Number(item._sum.amount ?? 0),
    }));

    return {
      totalIncome: Number(allIncomes._sum.amount ?? 0),
      thisMonth: Number(thisMonthResult._sum.amount ?? 0),
      lastMonth: Number(lastMonthResult._sum.amount ?? 0),
      byCategory,
    };
  }

  private mapIncome(income: any) {
    return {
      ...income,
      amount: Number(income.amount),
    };
  }
}
