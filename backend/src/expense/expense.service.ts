import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseQueryDto } from './dto/expense.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  async findAll(query: ExpenseQueryDto, userId?: string) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.category) where.category = query.category;

    if (query.fromDate || query.toDate) {
      where.date = {};
      if (query.fromDate) where.date.gte = new Date(query.fromDate);
      if (query.toDate) where.date.lte = new Date(query.toDate + 'T23:59:59');
    }

    if (query.amountMin !== undefined || query.amountMax !== undefined) {
      where.amount = {};
      if (query.amountMin !== undefined) where.amount.gte = query.amountMin;
      if (query.amountMax !== undefined) where.amount.lte = query.amountMax;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { description: { contains: query.search } },
        { vendor: { contains: query.search } },
      ];
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
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
    if (!expense) throw new NotFoundException(`Expense record with id ${id} not found`);
    return this.mapExpense(expense);
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'expense');
  }

  async create(dto: CreateExpenseDto, userId?: string) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.expense.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'expense');
    }

    const expense = await this.prisma.expense.create({
      data: {
        code,
        category: dto.category,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        vendor: dto.vendor,
        createdById: userId ?? null,
      },
    });

    // Auto-create journal entry: debit Expense account, credit Cash/Bank
    await this.tryCreateJournalEntry(expense, userId).catch(() => null);

    return this.mapExpense(expense);
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findById(id);

    if (dto.code !== undefined) {
      const conflict = await this.prisma.expense.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.vendor !== undefined) data.vendor = dto.vendor;

    const expense = await this.prisma.expense.update({ where: { id }, data });
    return this.mapExpense(expense);
  }

  async remove(id: string) {
    const expense = await this.findById(id);
    // Delete linked journal entry (by reference = expense code)
    if (expense.code) {
      await this.deleteJournalEntryByRef(expense.code).catch(() => null);
    }
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Expense record deleted successfully' };
  }

  async getSummary() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allExpenses, thisMonthResult] = await Promise.all([
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfThisMonth } } }),
    ]);

    return {
      totalAllTime: Number(allExpenses._sum.amount ?? 0),
      totalThisMonth: Number(thisMonthResult._sum.amount ?? 0),
    };
  }

  // ── Ledger helpers ────────────────────────────────────────────────────────────

  private async tryCreateJournalEntry(expense: any, userId?: string) {
    // Find a Level-4 Expense account (debit side)
    const expenseAccount = await this.prisma.chartOfAccount.findFirst({
      where: { accountType: 'Expense', level: 4, isActive: true },
    });
    // Find a Level-4 Cash or Bank Asset account (credit side)
    const cashAccount = await this.prisma.chartOfAccount.findFirst({
      where: {
        accountType: 'Asset',
        level: 4,
        isActive: true,
        OR: [{ name: { contains: 'Cash' } }, { name: { contains: 'Bank' } }],
      },
    });

    if (!expenseAccount || !cashAccount) return; // accounts not configured — skip silently

    const amount = Number(expense.amount);
    await this.accounts.createJournalEntry(
      {
        date: expense.date.toISOString().split('T')[0],
        description: expense.description ?? `Expense: ${expense.code ?? expense.id}`,
        reference: expense.code ?? expense.id,
        lines: [
          { accountId: expenseAccount.id, debit: amount, credit: 0, description: 'Expense recorded' },
          { accountId: cashAccount.id, debit: 0, credit: amount, description: 'Cash paid' },
        ],
      },
      userId,
    );
  }

  private async deleteJournalEntryByRef(reference: string) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { reference } });
    if (entry) await this.prisma.journalEntry.delete({ where: { id: entry.id } });
  }

  private mapExpense(expense: any) {
    return { ...expense, amount: Number(expense.amount) };
  }
}
