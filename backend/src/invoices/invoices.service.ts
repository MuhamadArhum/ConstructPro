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
    const taxAmount = dto.taxAmount ?? 0;
    const total = subtotal + taxAmount;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await this.prisma.$transaction(async (tx) => {
      return tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: dto.customerId,
          projectId: dto.projectId,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          status: dto.status ?? 'Draft',
          subtotal,
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
    const taxAmount = dto.taxAmount;
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
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: dto.status },
      include: {
        customer: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Only process payment transaction when transitioning TO Paid for the first time
    if (dto.status === 'Paid' && invoice.status !== 'Paid') {
      const invoiceTotal = Number(invoice.total);
      await this.prisma.$transaction([
        this.prisma.customerTransaction.create({
          data: {
            customerId: invoice.customerId,
            type: 'PAYMENT',
            amount: invoiceTotal,
            date: new Date(),
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            reference: invoice.invoiceNumber,
          },
        }),
        this.prisma.customer.update({
          where: { id: invoice.customerId },
          data: {
            totalBilled: { increment: invoiceTotal },
            totalPaid: { increment: invoiceTotal },
          },
        }),
      ]);
    }

    return this.mapInvoice(updated);
  }

  async remove(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    if (invoice.status === 'Paid') {
      throw new BadRequestException(
        'Cannot delete a Paid invoice. Change status to Cancelled first.',
      );
    }

    await this.prisma.invoice.delete({ where: { id } });
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
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
