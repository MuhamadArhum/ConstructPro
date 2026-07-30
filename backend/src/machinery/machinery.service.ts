import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMachineryDto,
  UpdateMachineryDto,
  AddMachineryMaintenanceDto,
  MachineryQueryDto,
} from './dto/machinery.dto';
import { MachineryStatus } from '@prisma/client';

@Injectable()
export class MachineryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: MachineryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [machineries, total] = await Promise.all([
      this.prisma.machinery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.machinery.count({ where }),
    ]);

    return {
      data: machineries.map((m) => this.mapMachinery(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const machinery = await this.prisma.machinery.findUnique({
      where: { id },
      include: {
        maintenanceRecords: {
          orderBy: { maintenanceDate: 'desc' },
        },
      },
    });

    if (!machinery) {
      throw new NotFoundException(`Machinery with id ${id} not found`);
    }

    return {
      ...this.mapMachinery(machinery),
      maintenanceRecords: machinery.maintenanceRecords.map((r) =>
        this.mapMaintenanceRecord(r),
      ),
    };
  }

  async create(dto: CreateMachineryDto) {
    const machinery = await this.prisma.machinery.create({
      data: {
        name: dto.name,
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: dto.purchasePrice }),
        ...(dto.status !== undefined && { status: dto.status }),
        totalRunningHours: dto.totalRunningHours ?? 0,
        ...(dto.nextMaintenanceDate !== undefined && {
          nextMaintenanceDate: new Date(dto.nextMaintenanceDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapMachinery(machinery);
  }

  async update(id: string, dto: UpdateMachineryDto) {
    await this.findById(id);

    const machinery = await this.prisma.machinery.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: dto.purchasePrice }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.totalRunningHours !== undefined && {
          totalRunningHours: dto.totalRunningHours,
        }),
        ...(dto.nextMaintenanceDate !== undefined && {
          nextMaintenanceDate: new Date(dto.nextMaintenanceDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapMachinery(machinery);
  }

  async remove(id: string) {
    await this.findById(id);

    await this.prisma.machinery.delete({ where: { id } });

    return { message: 'Machinery deleted successfully' };
  }

  async getMaintenanceHistory(id: string) {
    await this.findById(id);

    const records = await this.prisma.machineryMaintenance.findMany({
      where: { machineryId: id },
      orderBy: { maintenanceDate: 'desc' },
    });

    return records.map((r) => this.mapMaintenanceRecord(r));
  }

  async addMaintenance(id: string, dto: AddMachineryMaintenanceDto) {
    await this.findById(id);

    const record = await this.prisma.machineryMaintenance.create({
      data: {
        machineryId: id,
        maintenanceDate: new Date(dto.maintenanceDate),
        type: dto.type,
        ...(dto.description !== undefined && { description: dto.description }),
        cost: dto.cost ?? 0,
        ...(dto.runningHoursAtService !== undefined && {
          runningHoursAtService: dto.runningHoursAtService,
        }),
        ...(dto.nextMaintenanceDate !== undefined && {
          nextMaintenanceDate: new Date(dto.nextMaintenanceDate),
        }),
        ...(dto.serviceProvider !== undefined && { serviceProvider: dto.serviceProvider }),
      },
    });

    // Update nextMaintenanceDate on machinery if provided
    if (dto.nextMaintenanceDate) {
      await this.prisma.machinery.update({
        where: { id },
        data: { nextMaintenanceDate: new Date(dto.nextMaintenanceDate) },
      });
    }

    return this.mapMaintenanceRecord(record);
  }

  async getDueForMaintenance() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const machineries = await this.prisma.machinery.findMany({
      where: {
        status: MachineryStatus.Active,
        nextMaintenanceDate: {
          lte: sevenDaysFromNow,
        },
      },
      orderBy: { nextMaintenanceDate: 'asc' },
    });

    return machineries.map((m) => this.mapMachinery(m));
  }

  private mapMachinery(machinery: {
    id: string;
    name: string;
    model: string | null;
    serialNumber: string | null;
    purchaseDate: Date | null;
    purchasePrice: any;
    status: any;
    totalRunningHours: any;
    nextMaintenanceDate: Date | null;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: machinery.id,
      name: machinery.name,
      model: machinery.model,
      serialNumber: machinery.serialNumber,
      purchaseDate: machinery.purchaseDate,
      purchasePrice: machinery.purchasePrice !== null ? Number(machinery.purchasePrice) : null,
      status: machinery.status,
      totalRunningHours: Number(machinery.totalRunningHours),
      nextMaintenanceDate: machinery.nextMaintenanceDate,
      notes: machinery.notes,
      createdAt: machinery.createdAt,
    };
  }

  private mapMaintenanceRecord(record: {
    id: string;
    machineryId: string;
    maintenanceDate: Date;
    type: any;
    description: string | null;
    cost: any;
    runningHoursAtService: any;
    nextMaintenanceDate: Date | null;
    serviceProvider: string | null;
    createdAt: Date;
  }) {
    return {
      id: record.id,
      machineryId: record.machineryId,
      maintenanceDate: record.maintenanceDate,
      type: record.type,
      description: record.description,
      cost: Number(record.cost),
      runningHoursAtService:
        record.runningHoursAtService !== null
          ? Number(record.runningHoursAtService)
          : null,
      nextMaintenanceDate: record.nextMaintenanceDate,
      serviceProvider: record.serviceProvider,
      createdAt: record.createdAt,
    };
  }
}
