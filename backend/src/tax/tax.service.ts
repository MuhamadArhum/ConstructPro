import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTaxDto, UpdateTaxDto, TaxQueryDto } from './dto/tax.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class TaxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  async findAll(query: TaxQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { reference: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

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

    return {
      items: records.map((r) => this.mapTaxRecord(r)),
      totalCount: total,
      pageNumber: page,
      pageSize: limit,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };
  }

  async findById(id: string) {
    const record = await this.prisma.taxRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Tax record with id ${id} not found`);
    return this.mapTaxRecord(record);
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'taxRecord');
  }

  async create(dto: CreateTaxDto, userId?: string) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.taxRecord.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'taxRecord');
    }

    const record = await this.prisma.taxRecord.create({
      data: {
        code,
        taxType: dto.taxType,
        amount: dto.amount,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        reference: dto.reference,
        description: dto.description,
        notes: dto.notes,
        isPaid: dto.isPaid ?? false,
        paidDate: dto.isPaid && dto.paidDate ? new Date(dto.paidDate) : dto.isPaid ? new Date() : null,
        createdById: userId ?? null,
      },
    });

    if (record.isPaid) {
      await this.tryCreateJournalEntry(record, userId).catch(() => null);
    }

    return this.mapTaxRecord(record);
  }

  async update(id: string, dto: UpdateTaxDto) {
    const before = await this.findById(id);

    if (dto.code !== undefined) {
      const conflict = await this.prisma.taxRecord.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const data: any = {};

    if (dto.code !== undefined) data.code = dto.code;
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
        data.paidDate = dto.paidDate ? new Date(dto.paidDate) : new Date();
      } else {
        data.paidDate = null;
      }
    } else if (dto.paidDate !== undefined) {
      data.paidDate = new Date(dto.paidDate);
    }

    const record = await this.prisma.taxRecord.update({ where: { id }, data });

    const ref = before.code ?? id;
    if (!before.isPaid && record.isPaid) {
      await this.tryCreateJournalEntry(record).catch(() => null);
    } else if (before.isPaid && !record.isPaid) {
      await this.deleteJournalEntryByRef(ref).catch(() => null);
    }

    return this.mapTaxRecord(record);
  }

  async remove(id: string) {
    const record = await this.findById(id);
    if (record.isPaid) {
      await this.deleteJournalEntryByRef(record.code ?? id).catch(() => null);
    }
    await this.prisma.taxRecord.delete({ where: { id } });
    return { message: 'Tax record deleted successfully' };
  }

  async getSummary() {
    const now = new Date();

    const [totalResult, paidResult, unpaidResult, overdueAmountResult, overdueCountResult, byTypeResult] =
      await Promise.all([
        this.prisma.taxRecord.aggregate({ _sum: { amount: true } }),
        this.prisma.taxRecord.aggregate({ _sum: { amount: true }, where: { isPaid: true } }),
        this.prisma.taxRecord.aggregate({ _sum: { amount: true }, where: { isPaid: false } }),
        this.prisma.taxRecord.aggregate({
          _sum: { amount: true },
          where: { isPaid: false, dueDate: { lt: now } },
        }),
        this.prisma.taxRecord.count({ where: { isPaid: false, dueDate: { lt: now } } }),
        this.prisma.taxRecord.groupBy({ by: ['taxType'], _sum: { amount: true } }),
      ]);

    return {
      totalTax: Number(totalResult._sum.amount ?? 0),
      totalPaid: Number(paidResult._sum.amount ?? 0),
      totalPending: Number(unpaidResult._sum.amount ?? 0),
      overdueAmount: Number(overdueAmountResult._sum.amount ?? 0),
      overdueCount: overdueCountResult,
      byType: byTypeResult.map((item) => ({
        taxType: item.taxType,
        total: Number(item._sum.amount ?? 0),
      })),
    };
  }

  private async tryCreateJournalEntry(tax: any, userId?: string) {
    const liabilityAccount = await this.prisma.chartOfAccount.findFirst({
      where: { accountType: 'Liability', level: 4, isActive: true },
    });
    const cashAccount = await this.prisma.chartOfAccount.findFirst({
      where: {
        accountType: 'Asset', level: 4, isActive: true,
        OR: [{ name: { contains: 'Cash' } }, { name: { contains: 'Bank' } }],
      },
    });
    if (!liabilityAccount || !cashAccount) return;

    const amount = Number(tax.amount);
    const ref = tax.code ?? tax.id;
    await this.accounts.createJournalEntry({
      date: (tax.paidDate ?? new Date()).toISOString().split('T')[0],
      description: tax.description ?? `Tax payment: ${ref}`,
      reference: ref,
      lines: [
        { accountId: liabilityAccount.id, debit: amount, credit: 0, description: 'Tax liability settled' },
        { accountId: cashAccount.id, debit: 0, credit: amount, description: 'Cash paid for tax' },
      ],
    }, userId);
  }

  private async deleteJournalEntryByRef(reference: string) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { reference } });
    if (entry) await this.prisma.journalEntry.delete({ where: { id: entry.id } });
  }

  private mapTaxRecord(record: any) {
    return {
      ...record,
      amount: Number(record.amount),
      taxTypeDisplay: record.taxType,
    };
  }
}
