import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxDto, UpdateTaxDto, TaxQueryDto } from './dto/tax.dto';

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TaxQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.taxType) {
      where.taxType = query.taxType;
    }

    if (query.isPaid !== undefined) {
      where.isPaid = query.isPaid;
    }

    if (query.startDate || query.endDate) {
      where.periodStart = {};
      if (query.startDate) {
        where.periodStart.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.periodStart.lte = new Date(query.endDate);
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.taxRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { periodStart: 'desc' },
      }),
      this.prisma.taxRecord.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: records.map((r) => this.mapTaxRecord(r)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const record = await this.prisma.taxRecord.findUnique({ where: { id } });

    if (!record) {
      throw new NotFoundException(`Tax record with id ${id} not found`);
    }

    return this.mapTaxRecord(record);
  }

  async create(dto: CreateTaxDto, userId?: string) {
    const record = await this.prisma.taxRecord.create({
      data: {
        taxType: dto.taxType,
        amount: dto.amount,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        reference: dto.reference,
        description: dto.description,
        notes: dto.notes,
        createdById: userId ?? null,
      },
    });

    return this.mapTaxRecord(record);
  }

  async update(id: string, dto: UpdateTaxDto) {
    await this.findById(id);

    const data: any = {};

    if (dto.taxType !== undefined) data.taxType = dto.taxType;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.periodStart !== undefined) data.periodStart = new Date(dto.periodStart);
    if (dto.periodEnd !== undefined) data.periodEnd = new Date(dto.periodEnd);
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.reference !== undefined) data.reference = dto.reference;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (dto.isPaid !== undefined) {
      data.isPaid = dto.isPaid;
      if (dto.isPaid) {
        // Use provided paidDate or default to now
        data.paidDate = dto.paidDate ? new Date(dto.paidDate) : new Date();
      } else {
        data.paidDate = null;
      }
    } else if (dto.paidDate !== undefined) {
      data.paidDate = new Date(dto.paidDate);
    }

    const record = await this.prisma.taxRecord.update({
      where: { id },
      data,
    });

    return this.mapTaxRecord(record);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.taxRecord.delete({ where: { id } });
    return { message: 'Tax record deleted successfully' };
  }

  async getSummary() {
    const now = new Date();

    const [totalResult, paidResult, unpaidResult, overdueResult, byTypeResult] =
      await Promise.all([
        this.prisma.taxRecord.aggregate({ _sum: { amount: true } }),
        this.prisma.taxRecord.aggregate({
          _sum: { amount: true },
          where: { isPaid: true },
        }),
        this.prisma.taxRecord.aggregate({
          _sum: { amount: true },
          where: { isPaid: false },
        }),
        this.prisma.taxRecord.aggregate({
          _sum: { amount: true },
          where: {
            isPaid: false,
            dueDate: { lt: now },
          },
        }),
        this.prisma.taxRecord.groupBy({
          by: ['taxType'],
          _sum: { amount: true },
        }),
      ]);

    const byType = byTypeResult.map((item) => ({
      taxType: item.taxType,
      total: Number(item._sum.amount ?? 0),
    }));

    return {
      totalTax: Number(totalResult._sum.amount ?? 0),
      paid: Number(paidResult._sum.amount ?? 0),
      unpaid: Number(unpaidResult._sum.amount ?? 0),
      overdue: Number(overdueResult._sum.amount ?? 0),
      byType,
    };
  }

  private mapTaxRecord(record: any) {
    return {
      ...record,
      amount: Number(record.amount),
      taxTypeDisplay: record.taxType,
    };
  }
}
