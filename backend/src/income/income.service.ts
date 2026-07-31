import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto, UpdateIncomeDto, IncomeQueryDto } from './dto/income.dto';

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IncomeQueryDto, userId?: string) {
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

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: incomes.map((i) => this.mapIncome(i)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
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

    const [allIncomes, thisMonthResult, paidResult, pendingResult] = await Promise.all([
      this.prisma.income.aggregate({ _sum: { amount: true } }),
      this.prisma.income.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfThisMonth } },
      }),
      this.prisma.income.aggregate({
        _sum: { amount: true },
        where: { isPaid: true },
      }),
      this.prisma.income.aggregate({
        _sum: { amount: true },
        where: { isPaid: false },
      }),
    ]);

    return {
      totalAllTime: Number(allIncomes._sum.amount ?? 0),
      totalThisMonth: Number(thisMonthResult._sum.amount ?? 0),
      totalPaid: Number(paidResult._sum.amount ?? 0),
      totalPending: Number(pendingResult._sum.amount ?? 0),
    };
  }

  private mapIncome(income: any) {
    return {
      ...income,
      amount: Number(income.amount),
    };
  }
}
