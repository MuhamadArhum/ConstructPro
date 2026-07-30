import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto, CreateCustomerTransactionDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CustomerQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: customers.map((c) => this.mapCustomer(c)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    return this.mapCustomer(customer);
  }

  async create(dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name,
        companyName: dto.companyName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        ntn: dto.ntn,
        cnic: dto.cnic,
        projectName: dto.projectName,
        notes: dto.notes,
      },
    });

    return this.mapCustomer(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findById(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.ntn !== undefined && { ntn: dto.ntn }),
        ...(dto.cnic !== undefined && { cnic: dto.cnic }),
        ...(dto.projectName !== undefined && { projectName: dto.projectName }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapCustomer(customer);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.customer.delete({ where: { id } });
    return { message: 'Customer deleted successfully' };
  }

  async getLedger(customerId: string, fromDate?: string, toDate?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const where: any = { customerId };
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate + 'T23:59:59');
    }

    const transactions = await this.prisma.customerTransaction.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    let runningBalance = 0;
    const rows = transactions.map((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === 'INVOICE') runningBalance += amt;
      else runningBalance -= amt;
      return {
        id: tx.id,
        date: tx.date,
        type: tx.type,
        description: tx.description,
        reference: tx.reference,
        debit: tx.type === 'INVOICE' ? amt : 0,
        credit: tx.type === 'PAYMENT' ? amt : 0,
        balance: runningBalance,
        createdAt: tx.createdAt,
      };
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        companyName: customer.companyName,
        phone: customer.phone,
        totalBilled: Number(customer.totalBilled),
        totalPaid: Number(customer.totalPaid),
        outstandingBalance: Number(customer.totalBilled) - Number(customer.totalPaid),
      },
      transactions: rows,
      summary: {
        totalDebit: rows.reduce((s, r) => s + r.debit, 0),
        totalCredit: rows.reduce((s, r) => s + r.credit, 0),
        closingBalance: runningBalance,
      },
    };
  }

  async addTransaction(customerId: string, dto: CreateCustomerTransactionDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const tx = await this.prisma.customerTransaction.create({
      data: {
        customerId,
        type: dto.type,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        reference: dto.reference,
      },
    });

    if (dto.type === 'INVOICE') {
      await this.prisma.customer.update({ where: { id: customerId }, data: { totalBilled: { increment: dto.amount } } });
    } else {
      await this.prisma.customer.update({ where: { id: customerId }, data: { totalPaid: { increment: dto.amount } } });
    }

    return { ...tx, amount: Number(tx.amount) };
  }

  async deleteTransaction(customerId: string, txId: string) {
    const tx = await this.prisma.customerTransaction.findFirst({ where: { id: txId, customerId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    await this.prisma.customerTransaction.delete({ where: { id: txId } });

    const amt = Number(tx.amount);
    if (tx.type === 'INVOICE') {
      await this.prisma.customer.update({ where: { id: customerId }, data: { totalBilled: { decrement: amt } } });
    } else {
      await this.prisma.customer.update({ where: { id: customerId }, data: { totalPaid: { decrement: amt } } });
    }

    return { message: 'Transaction deleted' };
  }

  private mapCustomer(customer: {
    id: string;
    name: string;
    companyName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    ntn: string | null;
    cnic: string | null;
    projectName: string | null;
    totalBilled: any;
    totalPaid: any;
    isActive: boolean;
    notes: string | null;
    createdAt: Date;
  }) {
    const totalBilled = Number(customer.totalBilled);
    const totalPaid = Number(customer.totalPaid);

    return {
      id: customer.id,
      name: customer.name,
      companyName: customer.companyName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      ntn: customer.ntn,
      cnic: customer.cnic,
      projectName: customer.projectName,
      totalBilled,
      totalPaid,
      outstandingBalance: totalBilled - totalPaid,
      isActive: customer.isActive,
      notes: customer.notes,
      createdAt: customer.createdAt,
    };
  }
}
