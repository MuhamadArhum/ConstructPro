import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBoqDto,
  UpdateBoqDto,
  CreateBoqSectionDto,
  UpdateBoqSectionDto,
  CreateBoqItemDto,
  UpdateBoqItemDto,
  CreateProgressBillDto,
} from './dto/boq.dto';

@Injectable()
export class BoqService {
  constructor(private readonly prisma: PrismaService) {}

  async getByProject(projectId: string) {
    const boq = await this.prisma.boq.findUnique({
      where: { projectId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
    if (!boq) return null;
    return this.mapBoq(boq);
  }

  async create(projectId: string, dto: CreateBoqDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const boq = await this.prisma.boq.create({
      data: {
        projectId,
        title: dto.title ?? 'Bill of Quantities',
        notes: dto.notes,
      },
      include: { sections: { include: { items: true } } },
    });
    return this.mapBoq(boq);
  }

  async update(projectId: string, dto: UpdateBoqDto) {
    const boq = await this.prisma.boq.findUnique({ where: { projectId } });
    if (!boq) throw new NotFoundException('BOQ not found');

    const updated = await this.prisma.boq.update({
      where: { projectId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        sections: { orderBy: { order: 'asc' }, include: { items: { orderBy: { order: 'asc' } } } },
      },
    });
    return this.mapBoq(updated);
  }

  async delete(projectId: string) {
    const boq = await this.prisma.boq.findUnique({ where: { projectId } });
    if (!boq) throw new NotFoundException('BOQ not found');
    await this.prisma.boq.delete({ where: { projectId } });
    return { message: 'BOQ deleted' };
  }

  // ── Sections ────────────────────────────────────────────────────────────────

  async addSection(projectId: string, dto: CreateBoqSectionDto) {
    const boq = await this.prisma.boq.findUnique({ where: { projectId } });
    if (!boq) throw new NotFoundException('BOQ not found');

    const maxOrder = await this.prisma.boqSection.aggregate({
      _max: { order: true },
      where: { boqId: boq.id },
    });
    const order = dto.order ?? ((maxOrder._max.order ?? -1) + 1);

    const section = await this.prisma.boqSection.create({
      data: { boqId: boq.id, title: dto.title, order },
      include: { items: true },
    });
    return this.mapSection(section);
  }

  async updateSection(sectionId: string, dto: UpdateBoqSectionDto) {
    const section = await this.prisma.boqSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    const updated = await this.prisma.boqSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    return this.mapSection(updated);
  }

  async deleteSection(sectionId: string) {
    const section = await this.prisma.boqSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    await this.prisma.boqSection.delete({ where: { id: sectionId } });
    return { message: 'Section deleted' };
  }

  // ── Items ────────────────────────────────────────────────────────────────────

  async addItem(sectionId: string, dto: CreateBoqItemDto) {
    const section = await this.prisma.boqSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    const maxOrder = await this.prisma.boqItem.aggregate({
      _max: { order: true },
      where: { sectionId },
    });
    const order = dto.order ?? ((maxOrder._max.order ?? -1) + 1);
    const qty = dto.quantity ?? 0;
    const rate = dto.unitRate ?? 0;
    const amount = qty * rate;

    const item = await this.prisma.boqItem.create({
      data: {
        sectionId,
        description: dto.description,
        unit: dto.unit ?? 'nos',
        quantity: qty,
        unitRate: rate,
        amount,
        notes: dto.notes,
        order,
      },
    });
    return this.mapItem(item);
  }

  async updateItem(itemId: string, dto: UpdateBoqItemDto) {
    const item = await this.prisma.boqItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');

    const qty = dto.quantity !== undefined ? dto.quantity : Number(item.quantity);
    const rate = dto.unitRate !== undefined ? dto.unitRate : Number(item.unitRate);
    const amount = qty * rate;

    const updated = await this.prisma.boqItem.update({
      where: { id: itemId },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        quantity: qty,
        unitRate: rate,
        amount,
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
    return this.mapItem(updated);
  }

  async deleteItem(itemId: string) {
    const item = await this.prisma.boqItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');
    await this.prisma.boqItem.delete({ where: { id: itemId } });
    return { message: 'Item deleted' };
  }

  // ── Progress Bills ───────────────────────────────────────────────────────────

  async createProgressBill(projectId: string, dto: CreateProgressBillDto) {
    const boq = await this.prisma.boq.findUnique({
      where: { projectId },
      include: {
        sections: { include: { items: true } },
      },
    });
    if (!boq) throw new NotFoundException('BOQ not found');

    // Validate all boqItemIds belong to this BOQ and check remaining qty
    const allItems = boq.sections.flatMap((s) => s.items);
    const itemMap = new Map(allItems.map((i) => [i.id, i]));

    for (const billItem of dto.items) {
      const boqItem = itemMap.get(billItem.boqItemId);
      if (!boqItem) throw new BadRequestException(`BOQ item ${billItem.boqItemId} not found in this BOQ`);

      const remaining = Number(boqItem.quantity) - Number(boqItem.billedQuantity);
      if (billItem.billedQty > remaining + 0.00001) {
        throw new BadRequestException(
          `Item "${boqItem.description}": billed qty (${billItem.billedQty}) exceeds remaining qty (${remaining.toFixed(4)})`
        );
      }
    }

    // Generate bill number
    const billCount = await this.prisma.boqProgressBill.count({ where: { boqId: boq.id } });
    const billNumber = billCount + 1;

    // Calculate invoice amounts
    const taxRate = dto.taxRate ?? 0;
    const invoiceItems = dto.items
      .filter((bi) => bi.billedQty > 0)
      .map((bi) => {
        const boqItem = itemMap.get(bi.boqItemId)!;
        const rate = Number(boqItem.unitRate);
        const amount = bi.billedQty * rate;
        return { boqItemId: bi.boqItemId, billedQty: bi.billedQty, rate, amount, boqItem };
      });

    if (invoiceItems.length === 0) {
      throw new BadRequestException('At least one item with quantity > 0 is required');
    }

    const subtotal = invoiceItems.reduce((s, i) => s + i.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${dateStr}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const result = await this.prisma.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: dto.customerId,
          projectId,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          status: 'Draft',
          subtotal,
          taxRate,
          taxAmount,
          total,
          notes: dto.notes ?? `Progress Bill #${billNumber}`,
          items: {
            create: invoiceItems.map((i) => ({
              description: `${i.boqItem.description} (${i.billedQty} ${i.boqItem.unit})`,
              quantity: i.billedQty,
              unitPrice: i.rate,
              total: i.amount,
            })),
          },
        },
      });

      // Create BoqProgressBill record
      const progressBill = await tx.boqProgressBill.create({
        data: {
          boqId: boq.id,
          invoiceId: invoice.id,
          billNumber,
          notes: dto.notes,
          items: {
            create: invoiceItems.map((i) => ({
              boqItemId: i.boqItemId,
              billedQty: i.billedQty,
              unitRate: i.rate,
              amount: i.amount,
            })),
          },
        },
      });

      // Update billedQuantity on each BoqItem
      for (const i of invoiceItems) {
        await tx.boqItem.update({
          where: { id: i.boqItemId },
          data: {
            billedQuantity: {
              increment: i.billedQty,
            },
          },
        });
      }

      return { progressBill, invoice };
    });

    return {
      progressBillId: result.progressBill.id,
      billNumber,
      invoiceId: result.invoice.id,
      invoiceNumber,
      total,
    };
  }

  async getProgressBills(projectId: string) {
    const boq = await this.prisma.boq.findUnique({ where: { projectId } });
    if (!boq) return [];

    const bills = await this.prisma.boqProgressBill.findMany({
      where: { boqId: boq.id },
      orderBy: { billNumber: 'asc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            issueDate: true,
            dueDate: true,
            customer: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            boqItem: { select: { description: true, unit: true } },
          },
        },
      },
    });

    return bills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      notes: b.notes,
      createdAt: b.createdAt,
      invoice: {
        id: b.invoice.id,
        invoiceNumber: b.invoice.invoiceNumber,
        status: b.invoice.status,
        total: Number(b.invoice.total),
        issueDate: b.invoice.issueDate,
        dueDate: b.invoice.dueDate,
        customer: b.invoice.customer,
      },
      items: b.items.map((i) => ({
        id: i.id,
        boqItemId: i.boqItemId,
        description: i.boqItem.description,
        unit: i.boqItem.unit,
        billedQty: Number(i.billedQty),
        unitRate: Number(i.unitRate),
        amount: Number(i.amount),
      })),
    }));
  }

  // ── Mappers ──────────────────────────────────────────────────────────────────

  private mapBoq(boq: any) {
    const sections = (boq.sections ?? []).map((s: any) => this.mapSection(s));
    const grandTotal = sections.reduce((sum: number, s: any) => sum + s.subtotal, 0);
    const totalBilled = sections.reduce((sum: number, s: any) =>
      sum + s.items.reduce((ss: number, i: any) => ss + i.billedAmount, 0), 0);
    return {
      id: boq.id,
      projectId: boq.projectId,
      title: boq.title,
      notes: boq.notes,
      createdAt: boq.createdAt,
      updatedAt: boq.updatedAt,
      sections,
      grandTotal,
      totalBilled,
      remainingAmount: grandTotal - totalBilled,
    };
  }

  private mapSection(section: any) {
    const items = (section.items ?? []).map((i: any) => this.mapItem(i));
    const subtotal = items.reduce((sum: number, i: any) => sum + i.amount, 0);
    const billedSubtotal = items.reduce((sum: number, i: any) => sum + i.billedAmount, 0);
    return {
      id: section.id,
      boqId: section.boqId,
      title: section.title,
      order: section.order,
      items,
      subtotal,
      billedSubtotal,
    };
  }

  private mapItem(item: any) {
    const quantity = Number(item.quantity);
    const unitRate = Number(item.unitRate);
    const amount = Number(item.amount);
    const billedQuantity = Number(item.billedQuantity ?? 0);
    const remainingQuantity = Math.max(0, quantity - billedQuantity);
    const billedAmount = billedQuantity * unitRate;
    const remainingAmount = remainingQuantity * unitRate;

    return {
      id: item.id,
      sectionId: item.sectionId,
      description: item.description,
      unit: item.unit,
      quantity,
      unitRate,
      amount,
      billedQuantity,
      remainingQuantity,
      billedAmount,
      remainingAmount,
      notes: item.notes,
      order: item.order,
    };
  }
}
