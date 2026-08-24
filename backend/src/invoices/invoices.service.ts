import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  UpdateInvoiceStatusDto,
} from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    pageSize = 10,
    status?: string,
    customerId?: string,
    search?: string,
    projectId?: string,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (projectId) where.projectId = projectId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: data.map((inv) => this.mapInvoice(inv)),
      total,
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, companyName: true, phone: true, email: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    return {
      ...this.mapInvoice(invoice),
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async create(dto: CreateInvoiceDto) {
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxRate = dto.taxRate ?? 0;
    const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100;
    const total = subtotal + taxAmount;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const finalStatus = dto.status ?? 'Draft';

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: dto.customerId,
          projectId: dto.projectId,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          status: finalStatus,
          subtotal,
          taxRate,
          taxAmount,
          total,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          customer: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          items: true,
        },
      });

      // If created directly as Paid, record project income
      if (finalStatus === 'Paid' && dto.projectId) {
        await tx.projectIncome.create({
          data: {
            projectId: dto.projectId,
            category: 'Invoice',
            amount: total,
            tax: taxAmount,
            date: new Date(dto.issueDate),
            description: invoiceNumber,
            source: `invoice:${created.id}`,
          },
        });
      }

      return created;
    });

    return {
      ...this.mapInvoice(invoice),
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    await this.findOne(id);

    const items = dto.items;
    const subtotal = items
      ? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : undefined;
    const taxRate = dto.taxRate;
    const taxAmount =
      subtotal !== undefined && taxRate !== undefined
        ? Math.round((subtotal * taxRate) / 100 * 100) / 100
        : dto.taxAmount;
    const total =
      subtotal !== undefined ? subtotal + (taxAmount ?? 0) : undefined;

    const invoice = await this.prisma.$transaction(async (tx) => {
      if (items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          ...(dto.customerId !== undefined && { customerId: dto.customerId }),
          ...(dto.projectId !== undefined && { projectId: dto.projectId }),
          ...(dto.issueDate !== undefined && {
            issueDate: new Date(dto.issueDate),
          }),
          ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(subtotal !== undefined && { subtotal }),
          ...(taxRate !== undefined && { taxRate }),
          ...(taxAmount !== undefined && { taxAmount }),
          ...(total !== undefined && { total }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(items && {
            items: {
              create: items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
              })),
            },
          }),
        },
        include: {
          customer: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          items: true,
        },
      });
    });

    return {
      ...this.mapInvoice(invoice),
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id } });
      if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

      const wasPaid = invoice.status === 'Paid';
      const becomingPaid = dto.status === 'Paid' && !wasPaid;
      const unpaying = wasPaid && dto.status !== 'Paid';

      const updated = await tx.invoice.update({
        where: { id },
        data: { status: dto.status },
        include: {
          customer: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      });

      if (becomingPaid) {
        const invoiceTotal = Number(invoice.total);

        // Customer ledger
        await tx.customerTransaction.create({
          data: {
            customerId: invoice.customerId,
            type: 'PAYMENT',
            amount: invoiceTotal,
            date: new Date(),
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            reference: invoice.invoiceNumber,
          },
        });
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            totalBilled: { increment: invoiceTotal },
            totalPaid: { increment: invoiceTotal },
          },
        });

        // Project income (P&L)
        if (invoice.projectId) {
          await tx.projectIncome.create({
            data: {
              projectId: invoice.projectId,
              category: 'Invoice',
              amount: invoiceTotal,
              tax: Number(invoice.taxAmount),
              date: invoice.issueDate,
              description: invoice.invoiceNumber,
              source: `invoice:${invoice.id}`,
            },
          });
        }
      }

      // If reverting from Paid — remove linked project income
      if (unpaying && invoice.projectId) {
        await tx.projectIncome.deleteMany({
          where: { projectId: invoice.projectId, source: `invoice:${invoice.id}` },
        });
      }

      return this.mapInvoice(updated);
    });
  }

  async remove(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    await this.prisma.$transaction(async (tx) => {
      // If Paid — reverse customer balance and remove project income
      if (invoice.status === 'Paid') {
        const invoiceTotal = Number(invoice.total);
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            totalBilled: { decrement: invoiceTotal },
            totalPaid: { decrement: invoiceTotal },
          },
        });
      }

      // Remove linked project income regardless of status
      if (invoice.projectId) {
        await tx.projectIncome.deleteMany({
          where: { projectId: invoice.projectId, source: `invoice:${invoice.id}` },
        });
      }

      await tx.invoice.delete({ where: { id } });
    });

    return { message: 'Invoice deleted successfully' };
  }

  private mapInvoice(invoice: any) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customer?.name ?? null,
      customer: invoice.customer ?? null,
      projectId: invoice.projectId,
      projectName: invoice.project?.name ?? null,
      project: invoice.project ?? null,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
