import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlantDto,
  UpdatePlantDto,
  PlantQueryDto,
  AddPlantMaintenanceDto,
} from './dto/plant.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class PlantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PlantQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
        { type: { contains: query.search } },
        { manufacturer: { contains: query.search } },
        { serialNumber: { contains: query.search } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [plants, total] = await Promise.all([
      this.prisma.plant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plant.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: plants.map((p) => this.mapPlant(p)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id },
    });

    if (!plant) {
      throw new NotFoundException(`Plant with id ${id} not found`);
    }

    return this.mapPlant(plant);
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'plant');
  }

  async create(dto: CreatePlantDto) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.plant.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'plant');
    }
    const plant = await this.prisma.plant.create({
      data: {
        code,
        name: dto.name,
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: dto.purchasePrice }),
        ...(dto.currentValue !== undefined && { currentValue: dto.currentValue }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.lastMaintenanceDate !== undefined && {
          lastMaintenanceDate: new Date(dto.lastMaintenanceDate),
        }),
        ...(dto.nextMaintenanceDate !== undefined && {
          nextMaintenanceDate: new Date(dto.nextMaintenanceDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapPlant(plant);
  }

  async update(id: string, dto: UpdatePlantDto) {
    await this.findById(id);

    if (dto.code !== undefined) {
      const conflict = await this.prisma.plant.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const plant = await this.prisma.plant.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: dto.purchasePrice }),
        ...(dto.currentValue !== undefined && { currentValue: dto.currentValue }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.lastMaintenanceDate !== undefined && {
          lastMaintenanceDate: new Date(dto.lastMaintenanceDate),
        }),
        ...(dto.nextMaintenanceDate !== undefined && {
          nextMaintenanceDate: new Date(dto.nextMaintenanceDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapPlant(plant);
  }

  async remove(id: string) {
    await this.findById(id);

    await this.prisma.plant.delete({ where: { id } });

    return { message: 'Plant deleted successfully' };
  }

  async getMaintenanceHistory(plantId: string) {
    await this.findById(plantId);

    return this.prisma.plantMaintenance.findMany({
      where: { plantId },
      orderBy: { maintenanceDate: 'desc' },
    });
  }

  async addMaintenance(plantId: string, dto: AddPlantMaintenanceDto) {
    await this.findById(plantId);

    const record = await this.prisma.plantMaintenance.create({
      data: {
        plantId,
        maintenanceDate: new Date(dto.maintenanceDate),
        description: dto.description ?? null,
        cost: dto.cost ?? 0,
        serviceProvider: dto.serviceProvider ?? null,
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
        notes: dto.notes ?? null,
      },
    });

    if (dto.nextMaintenanceDate) {
      await this.prisma.plant.update({
        where: { id: plantId },
        data: {
          lastMaintenanceDate: new Date(dto.maintenanceDate),
          nextMaintenanceDate: new Date(dto.nextMaintenanceDate),
        },
      });
    } else {
      await this.prisma.plant.update({
        where: { id: plantId },
        data: { lastMaintenanceDate: new Date(dto.maintenanceDate) },
      });
    }

    return record;
  }

  async deleteMaintenance(plantId: string, recordId: string) {
    await this.findById(plantId);

    const record = await this.prisma.plantMaintenance.findFirst({
      where: { id: recordId, plantId },
    });

    if (!record) throw new NotFoundException('Maintenance record not found');

    await this.prisma.plantMaintenance.delete({ where: { id: recordId } });

    return { message: 'Maintenance record deleted' };
  }

  private mapPlant(plant: {
    id: string;
    code?: string | null;
    name: string;
    type: string | null;
    manufacturer: string | null;
    serialNumber: string | null;
    purchaseDate: Date | null;
    purchasePrice: any;
    currentValue: any;
    status: any;
    location: string | null;
    lastMaintenanceDate: Date | null;
    nextMaintenanceDate: Date | null;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: plant.id,
      code: plant.code ?? null,
      name: plant.name,
      type: plant.type,
      manufacturer: plant.manufacturer,
      serialNumber: plant.serialNumber,
      purchaseDate: plant.purchaseDate,
      purchasePrice: plant.purchasePrice !== null ? Number(plant.purchasePrice) : null,
      currentValue: plant.currentValue !== null ? Number(plant.currentValue) : null,
      status: plant.status,
      statusDisplay: plant.status,
      location: plant.location,
      lastMaintenanceDate: plant.lastMaintenanceDate,
      nextMaintenanceDate: plant.nextMaintenanceDate,
      notes: plant.notes,
      createdAt: plant.createdAt,
    };
  }
}
