import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountQueryDto,
  CreateJournalEntryDto,
  JournalEntryQueryDto,
} from './dto/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Chart of Accounts ────────────────────────────────────────────

  async findAllAccounts(query: AccountQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { code: { contains: query.search } },
      ];
    }

    if (query.accountType) {
      where.accountType = query.accountType;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [accounts, total] = await Promise.all([
      this.prisma.chartOfAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: { children: true, parent: true },
      }),
      this.prisma.chartOfAccount.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: accounts.map((a) => this.mapAccount(a)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findAccountById(id: string) {
    const account = await this.prisma.chartOfAccount.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });

    if (!account) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    return this.mapAccount(account);
  }

  async createAccount(dto: CreateAccountDto) {
    const existing = await this.prisma.chartOfAccount.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Account with code '${dto.code}' already exists`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.chartOfAccount.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent account with id ${dto.parentId} not found`);
      }
    }

    const account = await this.prisma.chartOfAccount.create({
      data: {
        code: dto.code,
        name: dto.name,
        accountType: dto.accountType,
        parentId: dto.parentId ?? null,
        description: dto.description,
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { children: true },
    });

    return this.mapAccount(account);
  }

  async updateAccount(id: string, dto: UpdateAccountDto) {
    await this.findAccountById(id);

    const data: any = {};

    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.accountType !== undefined) data.accountType = dto.accountType;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.description !== undefined) data.description = dto.description;

    const account = await this.prisma.chartOfAccount.update({
      where: { id },
      data,
      include: { children: true },
    });

    return this.mapAccount(account);
  }

  async deleteAccount(id: string) {
    await this.findAccountById(id);

    const lineCount = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });

    if (lineCount > 0) {
      throw new BadRequestException(
        `Cannot delete account: it is referenced by ${lineCount} journal entry line(s)`,
      );
    }

    await this.prisma.chartOfAccount.delete({ where: { id } });
    return { message: 'Account deleted successfully' };
  }

  // ─── Journal Entries ──────────────────────────────────────────────

  async findAllJournalEntries(query: JournalEntryQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { entryNumber: { contains: query.search } },
        { description: { contains: query.search } },
        { reference: { contains: query.search } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (query.isPosted !== undefined) {
      where.isPosted = query.isPosted;
    }

    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          lines: {
            include: { account: true },
          },
        },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: entries.map((e) => this.mapJournalEntry(e)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findJournalEntryById(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: { account: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Journal entry with id ${id} not found`);
    }

    return this.mapJournalEntry(entry);
  }

  async createJournalEntry(dto: CreateJournalEntryDto, userId?: string) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Journal entry must have at least one line');
    }

    const totalDebit = dto.lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        `Journal entry is unbalanced: total debit (${totalDebit}) must equal total credit (${totalCredit})`,
      );
    }

    const entryNumber = `JE-${Date.now()}`;

    const entry = await this.prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(dto.date),
        description: dto.description,
        reference: dto.reference,
        notes: dto.notes,
        totalDebit,
        totalCredit,
        isPosted: true,
        createdById: userId ?? null,
        lines: {
          createMany: {
            data: dto.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.debit ?? 0,
              credit: line.credit ?? 0,
              description: line.description,
            })),
          },
        },
      },
      include: {
        lines: {
          include: { account: true },
        },
      },
    });

    return this.mapJournalEntry(entry);
  }

  async deleteJournalEntry(id: string) {
    await this.findJournalEntryById(id);
    // Lines are cascade-deleted via Prisma schema onDelete: Cascade
    await this.prisma.journalEntry.delete({ where: { id } });
    return { message: 'Journal entry deleted successfully' };
  }

  // ─── Mappers ──────────────────────────────────────────────────────

  private mapAccount(account: any) {
    return {
      ...account,
      accountTypeDisplay: account.accountType,
      parentName: account.parent?.name ?? null,
      balance: 0,
    };
  }

  private mapJournalEntry(entry: any) {
    return {
      ...entry,
      totalDebit: Number(entry.totalDebit),
      totalCredit: Number(entry.totalCredit),
      lines: (entry.lines ?? []).map((line: any) => ({
        ...line,
        debit: Number(line.debit),
        credit: Number(line.credit),
        accountCode: line.account?.code ?? '',
        accountName: line.account?.name ?? '',
      })),
    };
  }
}
