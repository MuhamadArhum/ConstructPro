import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlantDto,
  UpdatePlantDto,
  PlantQueryDto,
} from './dto/plant.dto';

@Injectable()
export class PlantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PlantQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { type: { contains: query.search, mode: 'insensitive' } },
        { manufacturer: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
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

    return {
      data: plants.map((p) => this.mapPlant(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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

  async create(dto: CreatePlantDto) {
    const plant = await this.prisma.plant.create({
      data: {
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

    const plant = await this.prisma.plant.update({
      where: { id },
      data: {
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

  private mapPlant(plant: {
    id: string;
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
      name: plant.name,
      type: plant.type,
      manufacturer: plant.manufacturer,
      serialNumber: plant.serialNumber,
      purchaseDate: plant.purchaseDate,
      purchasePrice: plant.purchasePrice !== null ? Number(plant.purchasePrice) : null,
      currentValue: plant.currentValue !== null ? Number(plant.currentValue) : null,
      status: plant.status,
      location: plant.location,
      lastMaintenanceDate: plant.lastMaintenanceDate,
      nextMaintenanceDate: plant.nextMaintenanceDate,
      notes: plant.notes,
      createdAt: plant.createdAt,
    };
  }
}
