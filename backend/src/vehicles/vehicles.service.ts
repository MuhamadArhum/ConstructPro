import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateVehicleMaintenanceDto,
  VehicleQueryDto,
} from './dto/vehicle.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: VehicleQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { registrationNumber: { contains: query.search } },
        { make: { contains: query.search } },
        { model: { contains: query.search } },
        { driverName: { contains: query.search } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { maintenanceRecords: true } } },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: vehicles.map((v) => this.mapVehicle(v)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        maintenanceRecords: {
          orderBy: { maintenanceDate: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id ${id} not found`);
    }

    return {
      ...this.mapVehicle(vehicle),
      maintenanceRecords: vehicle.maintenanceRecords.map((r) =>
        this.mapMaintenanceRecord(r),
      ),
    };
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'vehicle');
  }

  async create(dto: CreateVehicleDto) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.vehicle.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'vehicle');
    }
    const vehicle = await this.prisma.vehicle.create({
      data: {
        code,
        registrationNumber: dto.registrationNumber,
        ...(dto.make !== undefined && { make: dto.make }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.driverName !== undefined && { driverName: dto.driverName }),
        ...(dto.driverContact !== undefined && { driverContact: dto.driverContact }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: dto.purchasePrice }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.status !== undefined && { status: dto.status }),
        totalMileage: dto.totalMileage ?? 0,
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapVehicle(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findById(id);

    if (dto.code !== undefined) {
      const conflict = await this.prisma.vehicle.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.make !== undefined && { make: dto.make }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.driverName !== undefined && { driverName: dto.driverName }),
        ...(dto.driverContact !== undefined && { driverContact: dto.driverContact }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: dto.purchasePrice }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.totalMileage !== undefined && { totalMileage: dto.totalMileage }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapVehicle(vehicle);
  }

  async remove(id: string) {
    await this.findById(id);

    await this.prisma.vehicle.delete({ where: { id } });

    return { message: 'Vehicle deleted successfully' };
  }

  async getMaintenanceHistory(id: string) {
    await this.findById(id);

    const records = await this.prisma.vehicleMaintenance.findMany({
      where: { vehicleId: id },
      orderBy: { maintenanceDate: 'desc' },
    });

    return records.map((r) => this.mapMaintenanceRecord(r));
  }

  async addMaintenance(id: string, dto: CreateVehicleMaintenanceDto) {
    await this.findById(id);

    const record = await this.prisma.vehicleMaintenance.create({
      data: {
        vehicleId: id,
        maintenanceDate: new Date(dto.maintenanceDate),
        ...(dto.description !== undefined && { description: dto.description }),
        cost: dto.cost ?? 0,
        ...(dto.serviceProvider !== undefined && { serviceProvider: dto.serviceProvider }),
        ...(dto.nextDueDate !== undefined && { nextDueDate: new Date(dto.nextDueDate) }),
        ...(dto.mileageAtService !== undefined && { mileageAtService: dto.mileageAtService }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.mapMaintenanceRecord(record);
  }

  private mapVehicle(vehicle: {
    id: string;
    code?: string | null;
    registrationNumber: string;
    make: string | null;
    model: string | null;
    year: number | null;
    driverName: string | null;
    driverContact: string | null;
    purchasePrice: any;
    purchaseDate: Date | null;
    status: any;
    totalMileage: any;
    nextMaintenanceDate: Date | null;
    notes: string | null;
    createdAt: Date;
    _count?: { maintenanceRecords: number };
  }) {
    return {
      id: vehicle.id,
      code: vehicle.code ?? null,
      registrationNumber: vehicle.registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      driverName: vehicle.driverName,
      driverContact: vehicle.driverContact,
      purchasePrice: vehicle.purchasePrice !== null ? Number(vehicle.purchasePrice) : null,
      purchaseDate: vehicle.purchaseDate,
      status: vehicle.status,
      statusDisplay: vehicle.status,
      totalMileage: Number(vehicle.totalMileage),
      nextMaintenanceDate: vehicle.nextMaintenanceDate,
      notes: vehicle.notes,
      createdAt: vehicle.createdAt,
      maintenanceCount: vehicle._count?.maintenanceRecords ?? 0,
    };
  }

  private mapMaintenanceRecord(record: {
    id: string;
    vehicleId: string;
    maintenanceDate: Date;
    description: string | null;
    cost: any;
    serviceProvider: string | null;
    nextDueDate: Date | null;
    mileageAtService: any;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: record.id,
      vehicleId: record.vehicleId,
      maintenanceDate: record.maintenanceDate,
      description: record.description,
      cost: Number(record.cost),
      serviceProvider: record.serviceProvider,
      nextDueDate: record.nextDueDate,
      mileageAtService:
        record.mileageAtService !== null ? Number(record.mileageAtService) : null,
      notes: record.notes,
      createdAt: record.createdAt,
    };
  }
}
