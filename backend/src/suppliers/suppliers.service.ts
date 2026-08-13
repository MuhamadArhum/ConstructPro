import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto, CreateSupplierTransactionDto } from './dto/supplier.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SupplierQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
        { companyName: { contains: query.search } },
        { phone: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: suppliers.map((s) => this.mapSupplier(s)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    return this.mapSupplier(supplier);
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'supplier');
  }

  async create(dto: CreateSupplierDto) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.supplier.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'supplier');
    }
    const supplier = await this.prisma.supplier.create({
      data: {
        code,
        name: dto.name,
        companyName: dto.companyName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        ntn: dto.ntn,
        category: dto.category,
        notes: dto.notes,
      },
    });

    return this.mapSupplier(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findById(id);

    if (dto.code !== undefined) {
      const conflict = await this.prisma.supplier.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.ntn !== undefined && { ntn: dto.ntn }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapSupplier(supplier);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Supplier deleted successfully' };
  }

  async getLedger(supplierId: string, fromDate?: string, toDate?: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const where: any = { supplierId };
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate + 'T23:59:59');
    }

    const transactions = await this.prisma.supplierTransaction.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    let runningBalance = 0;
    const rows = transactions.map((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === 'PURCHASE') runningBalance += amt;
      else runningBalance -= amt;
      return {
        id: tx.id,
        date: tx.date,
        type: tx.type,
        description: tx.description,
        reference: tx.reference,
        debit: tx.type === 'PURCHASE' ? amt : 0,
        credit: tx.type === 'PAYMENT' ? amt : 0,
        balance: runningBalance,
        createdAt: tx.createdAt,
      };
    });

    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        companyName: supplier.companyName,
        phone: supplier.phone,
        totalPurchased: Number(supplier.totalPurchased),
        totalPaid: Number(supplier.totalPaid),
        outstandingBalance: Number(supplier.totalPurchased) - Number(supplier.totalPaid),
      },
      transactions: rows,
      summary: {
        totalDebit: rows.reduce((s, r) => s + r.debit, 0),
        totalCredit: rows.reduce((s, r) => s + r.credit, 0),
        closingBalance: runningBalance,
      },
    };
  }

  async addTransaction(supplierId: string, dto: CreateSupplierTransactionDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const tx = await this.prisma.supplierTransaction.create({
      data: {
        supplierId,
        type: dto.type,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        reference: dto.reference,
      },
    });

    if (dto.type === 'PURCHASE') {
      await this.prisma.supplier.update({ where: { id: supplierId }, data: { totalPurchased: { increment: dto.amount } } });
    } else {
      await this.prisma.supplier.update({ where: { id: supplierId }, data: { totalPaid: { increment: dto.amount } } });
    }

    return { ...tx, amount: Number(tx.amount) };
  }

  async deleteTransaction(supplierId: string, txId: string) {
    const tx = await this.prisma.supplierTransaction.findFirst({ where: { id: txId, supplierId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    await this.prisma.supplierTransaction.delete({ where: { id: txId } });

    const amt = Number(tx.amount);
    if (tx.type === 'PURCHASE') {
      await this.prisma.supplier.update({ where: { id: supplierId }, data: { totalPurchased: { decrement: amt } } });
    } else {
      await this.prisma.supplier.update({ where: { id: supplierId }, data: { totalPaid: { decrement: amt } } });
    }

    return { message: 'Transaction deleted' };
  }

  private mapSupplier(supplier: {
    id: string;
    code?: string | null;
    name: string;
    companyName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    ntn: string | null;
    category: string | null;
    totalPurchased: any;
    totalPaid: any;
    isActive: boolean;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: supplier.id,
      code: supplier.code ?? null,
      name: supplier.name,
      companyName: supplier.companyName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      ntn: supplier.ntn,
      category: supplier.category,
      totalPurchased: Number(supplier.totalPurchased),
      totalPaid: Number(supplier.totalPaid),
      outstandingBalance: Number(supplier.totalPurchased) - Number(supplier.totalPaid),
      isActive: supplier.isActive,
      notes: supplier.notes,
      createdAt: supplier.createdAt,
    };
  }
}
