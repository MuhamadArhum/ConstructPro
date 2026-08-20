import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBoqDto,
  UpdateBoqDto,
  CreateBoqSectionDto,
  UpdateBoqSectionDto,
  CreateBoqItemDto,
  UpdateBoqItemDto,
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

  // ── Mappers ──────────────────────────────────────────────────────────────────

  private mapBoq(boq: any) {
    const sections = (boq.sections ?? []).map((s: any) => this.mapSection(s));
    const grandTotal = sections.reduce((sum: number, s: any) => sum + s.subtotal, 0);
    return {
      id: boq.id,
      projectId: boq.projectId,
      title: boq.title,
      notes: boq.notes,
      createdAt: boq.createdAt,
      updatedAt: boq.updatedAt,
      sections,
      grandTotal,
    };
  }

  private mapSection(section: any) {
    const items = (section.items ?? []).map((i: any) => this.mapItem(i));
    const subtotal = items.reduce((sum: number, i: any) => sum + i.amount, 0);
    return {
      id: section.id,
      boqId: section.boqId,
      title: section.title,
      order: section.order,
      items,
      subtotal,
    };
  }

  private mapItem(item: any) {
    return {
      id: item.id,
      sectionId: item.sectionId,
      description: item.description,
      unit: item.unit,
      quantity: Number(item.quantity),
      unitRate: Number(item.unitRate),
      amount: Number(item.amount),
      notes: item.notes,
      order: item.order,
    };
  }
}
