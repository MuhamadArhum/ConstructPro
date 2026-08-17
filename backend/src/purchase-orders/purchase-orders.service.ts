import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePOStatusDto,
} from './dto/purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    pageSize = 10,
    status?: string,
    supplierId?: string,
    projectId?: string,
  ) {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {};

      if (status) where.status = status;
      if (supplierId) where.supplierId = supplierId;
      if (projectId) where.projectId = projectId;

      const [data, total] = await Promise.all([
        this.prisma.purchaseOrder.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            supplier: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
          },
        }),
        this.prisma.purchaseOrder.count({ where }),
      ]);

      return {
        data: data.map((po) => this.mapPO(po)),
        total,
      };
    } catch (err) {
      console.error('[PurchaseOrdersService.findAll]', err);
      return { data: [], total: 0 };
    }
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });

    if (!po) throw new NotFoundException(`Purchase Order ${id} not found`);

    return {
      ...this.mapPO(po),
      items: po.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async create(dto: CreatePurchaseOrderDto) {
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = dto.taxAmount ?? 0;
    const total = subtotal + taxAmount;

    const suffix = Math.floor(Math.random() * 9000) + 1000;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const poNumber = `PO-${dateStr}-${suffix}`;

    const po = await this.prisma.$transaction(async (tx) => {
      return tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: dto.supplierId,
          projectId: dto.projectId,
          issueDate: new Date(dto.issueDate),
          expectedDelivery: dto.expectedDelivery
            ? new Date(dto.expectedDelivery)
            : undefined,
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
          supplier: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          items: true,
        },
      });
    });

    return {
      ...this.mapPO(po),
      items: po.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    await this.findOne(id);

    const items = dto.items;
    const subtotal = items
      ? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : undefined;
    const taxAmount = dto.taxAmount;
    const total =
      subtotal !== undefined ? subtotal + (taxAmount ?? 0) : undefined;

    const po = await this.prisma.$transaction(async (tx) => {
      if (items) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
          ...(dto.projectId !== undefined && { projectId: dto.projectId }),
          ...(dto.issueDate !== undefined && {
            issueDate: new Date(dto.issueDate),
          }),
          ...(dto.expectedDelivery !== undefined && {
            expectedDelivery: new Date(dto.expectedDelivery),
          }),
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
          supplier: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          items: true,
        },
      });
    });

    return {
      ...this.mapPO(po),
      items: po.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async updateStatus(id: string, dto: UpdatePOStatusDto) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase Order ${id} not found`);

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: dto.status },
      include: {
        supplier: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // If received, create supplier purchase transaction and update supplier totals
    if (dto.status === 'Received') {
      const poTotal = Number(po.total);
      await this.prisma.$transaction([
        this.prisma.supplierTransaction.create({
          data: {
            supplierId: po.supplierId,
            type: 'PURCHASE',
            amount: poTotal,
            date: new Date(),
            description: `Purchase for PO ${po.poNumber}`,
            reference: po.poNumber,
          },
        }),
        this.prisma.supplier.update({
          where: { id: po.supplierId },
          data: {
            totalPurchased: { increment: poTotal },
          },
        }),
      ]);
    }

    return this.mapPO(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return { message: 'Purchase Order deleted successfully' };
  }

  private mapPO(po: any) {
    return {
      id: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplier?.name ?? null,
      supplier: po.supplier ?? null,
      projectId: po.projectId,
      projectName: po.project?.name ?? null,
      project: po.project ?? null,
      issueDate: po.issueDate,
      expectedDelivery: po.expectedDelivery,
      status: po.status,
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.taxAmount),
      total: Number(po.total),
      notes: po.notes,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
    };
  }
}
