import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  AddStockTransactionDto,
  InventoryQueryDto,
} from './dto/inventory.dto';
import { StockTransactionType } from '@prisma/client';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InventoryQueryDto) {
    const page = Math.max(1, Math.floor(query.pageNumber ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
        { category: { contains: query.search } },
        { supplierName: { contains: query.search } },
      ];
    }

    if (query.category) {
      where.category = { contains: query.category };
    }

    // lowStock filter: currentStock <= lowStockThreshold
    // Use $queryRaw for column-to-column comparison which Prisma's findMany does not support.
    if (query.lowStock === true) {
      const items = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM inventory_items
        WHERE current_stock <= low_stock_threshold
        ORDER BY current_stock ASC
        LIMIT ${limit} OFFSET ${skip}
      `;
      const totalCount = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM inventory_items
        WHERE current_stock <= low_stock_threshold
      `;

      const total = Number(totalCount[0].count);
      const totalPages = Math.ceil(total / limit);
      const pageNumber = page;
      const pageSize = limit;

      return {
        items: items.map((item) => this.mapInventoryItem({
          id: item.id,
          code: item.code,
          name: item.name,
          category: item.category,
          unit: item.unit,
          currentStock: item.current_stock,
          lowStockThreshold: item.low_stock_threshold,
          unitPrice: item.unit_price,
          supplierName: item.supplier_name,
          location: item.location,
          notes: item.notes,
          createdAt: new Date(item.created_at),
        })),
        totalCount: total,
        pageNumber,
        pageSize,
        totalPages,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
      };
    }

    const [inventoryItems, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: inventoryItems.map((item) => this.mapInventoryItem(item)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        stockTransactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with id ${id} not found`);
    }

    return {
      ...this.mapInventoryItem(item),
      stockTransactions: item.stockTransactions.map((t) =>
        this.mapStockTransaction(t),
      ),
    };
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'inventoryItem');
  }

  async create(dto: CreateInventoryItemDto) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.inventoryItem.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'inventoryItem');
    }
    const item = await this.prisma.inventoryItem.create({
      data: {
        code,
        name: dto.name,
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        currentStock: dto.currentStock ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 0,
        unitPrice: dto.unitPrice ?? 0,
        ...(dto.supplierName !== undefined && { supplierName: dto.supplierName }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapInventoryItem(item);
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    await this.findById(id);

    if (dto.code !== undefined) {
      const conflict = await this.prisma.inventoryItem.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.currentStock !== undefined && { currentStock: dto.currentStock }),
        ...(dto.lowStockThreshold !== undefined && {
          lowStockThreshold: dto.lowStockThreshold,
        }),
        ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
        ...(dto.supplierName !== undefined && { supplierName: dto.supplierName }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapInventoryItem(item);
  }

  async remove(id: string) {
    await this.findById(id);

    await this.prisma.inventoryItem.delete({ where: { id } });

    return { message: 'Inventory item deleted successfully' };
  }

  async getTransactions(id: string) {
    // Verify item exists (findById throws NotFoundException if not found)
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Inventory item with id ${id} not found`);
    }

    const transactions = await this.prisma.stockTransaction.findMany({
      where: { inventoryItemId: id },
      orderBy: { date: 'desc' },
    });

    return transactions.map((t) => this.mapStockTransaction(t));
  }

  async addTransaction(
    id: string,
    dto: AddStockTransactionDto,
    userId: string,
  ) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Inventory item with id ${id} not found`);
    }

    const currentStock = Number(item.currentStock);
    const quantity = Number(dto.quantity);
    let newStock: number;

    if (dto.type === StockTransactionType.In) {
      newStock = currentStock + quantity;
    } else if (dto.type === StockTransactionType.Out) {
      newStock = currentStock - quantity;
      if (newStock < 0) {
        throw new BadRequestException('Insufficient stock');
      }
    } else {
      // Adjustment: set stock directly to quantity
      newStock = quantity;
    }

    await this.prisma.stockTransaction.create({
      data: {
        inventoryItemId: id,
        type: dto.type,
        quantity: dto.quantity,
        ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
        date: new Date(dto.date),
        ...(dto.reference !== undefined && { reference: dto.reference }),
        ...(dto.projectName !== undefined && { projectName: dto.projectName }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(userId && { createdById: userId }),
      },
    });

    const updatedItem = await this.prisma.inventoryItem.update({
      where: { id },
      data: { currentStock: newStock },
    });

    return this.mapInventoryItem(updatedItem);
  }

  private mapInventoryItem(item: {
    id: string;
    code?: string | null;
    name: string;
    category: string | null;
    unit: string | null;
    currentStock: any;
    lowStockThreshold: any;
    unitPrice: any;
    supplierName: string | null;
    location: string | null;
    notes: string | null;
    createdAt: Date;
  }) {
    const currentStock = Number(item.currentStock);
    const lowStockThreshold = Number(item.lowStockThreshold);

    return {
      id: item.id,
      code: item.code ?? null,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock,
      lowStockThreshold,
      unitPrice: Number(item.unitPrice),
      supplierName: item.supplierName,
      location: item.location,
      isLowStock: currentStock <= lowStockThreshold,
      notes: item.notes,
      createdAt: item.createdAt,
    };
  }

  private mapStockTransaction(tx: {
    id: string;
    inventoryItemId: string;
    type: any;
    quantity: any;
    unitPrice: any;
    date: Date;
    reference: string | null;
    projectName: string | null;
    notes: string | null;
    createdAt: Date;
    createdById: string | null;
  }) {
    return {
      id: tx.id,
      inventoryItemId: tx.inventoryItemId,
      type: tx.type,
      quantity: Number(tx.quantity),
      unitPrice: tx.unitPrice !== null ? Number(tx.unitPrice) : null,
      date: tx.date,
      reference: tx.reference,
      projectName: tx.projectName,
      notes: tx.notes,
      createdById: tx.createdById,
      createdAt: tx.createdAt,
    };
  }
}
