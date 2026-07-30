import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLabourDto,
  UpdateLabourDto,
  UpsertAttendanceDto,
  AddAdvanceDto,
  LabourQueryDto,
} from './dto/labour.dto';

@Injectable()
export class LabourService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LabourQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { trade: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.trade) {
      where.trade = { contains: query.trade, mode: 'insensitive' };
    }

    const [labours, total] = await Promise.all([
      this.prisma.labour.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.labour.count({ where }),
    ]);

    const data = labours.map((l) => this.mapLabour(l));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const labour = await this.prisma.labour.findUnique({ where: { id } });

    if (!labour) {
      throw new NotFoundException(`Labour with id ${id} not found`);
    }

    return this.mapLabour(labour);
  }

  async create(dto: CreateLabourDto) {
    const labour = await this.prisma.labour.create({
      data: {
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        cnic: dto.cnic,
        address: dto.address,
        trade: dto.trade,
        dailyWage: Number(dto.dailyWage),
        overtimeRatePerHour: Number(dto.overtimeRatePerHour ?? 0),
        joinDate: new Date(dto.joinDate),
      },
    });

    return this.mapLabour(labour);
  }

  async update(id: string, dto: UpdateLabourDto) {
    await this.findById(id);

    const labour = await this.prisma.labour.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.cnic !== undefined && { cnic: dto.cnic }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.trade !== undefined && { trade: dto.trade }),
        ...(dto.dailyWage !== undefined && { dailyWage: Number(dto.dailyWage) }),
        ...(dto.overtimeRatePerHour !== undefined && {
          overtimeRatePerHour: Number(dto.overtimeRatePerHour),
        }),
        ...(dto.joinDate !== undefined && { joinDate: new Date(dto.joinDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapLabour(labour);
  }

  async deactivate(id: string) {
    await this.findById(id);

    const labour = await this.prisma.labour.update({
      where: { id },
      data: { isActive: false },
    });

    return this.mapLabour(labour);
  }

  async getAttendance(id: string, month: number, year: number) {
    await this.findById(id);

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await this.prisma.labourAttendance.findMany({
      where: {
        labourId: id,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      orderBy: { date: 'asc' },
    });

    return attendances.map((a) => this.mapAttendance(a));
  }

  async upsertAttendance(dto: UpsertAttendanceDto) {
    const labour = await this.prisma.labour.findUnique({ where: { id: dto.labourId } });

    if (!labour) {
      throw new NotFoundException(`Labour with id ${dto.labourId} not found`);
    }

    const dateValue = new Date(dto.date);

    const attendance = await this.prisma.labourAttendance.upsert({
      where: {
        labourId_date: {
          labourId: dto.labourId,
          date: dateValue,
        },
      },
      update: {
        isPresent: dto.isPresent,
        overtimeHours: Number(dto.overtimeHours ?? 0),
        notes: dto.notes,
      },
      create: {
        labourId: dto.labourId,
        date: dateValue,
        isPresent: dto.isPresent,
        overtimeHours: Number(dto.overtimeHours ?? 0),
        notes: dto.notes,
      },
    });

    return this.mapAttendance(attendance);
  }

  async getAdvances(id: string) {
    await this.findById(id);

    const advances = await this.prisma.labourAdvance.findMany({
      where: { labourId: id },
      orderBy: { date: 'desc' },
    });

    return advances.map((a) => this.mapAdvance(a));
  }

  async addAdvance(id: string, dto: AddAdvanceDto) {
    await this.findById(id);

    const advance = await this.prisma.labourAdvance.create({
      data: {
        labourId: id,
        amount: Number(dto.amount),
        date: new Date(dto.date),
        reason: dto.reason,
      },
    });

    return this.mapAdvance(advance);
  }

  async getLedger(id: string, month: number, year: number) {
    const labour = await this.prisma.labour.findUnique({ where: { id } });

    if (!labour) {
      throw new NotFoundException(`Labour with id ${id} not found`);
    }

    const dailyWage = Number(labour.dailyWage);
    const overtimeRatePerHour = Number(labour.overtimeRatePerHour);

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

    const [attendances, advances] = await Promise.all([
      this.prisma.labourAttendance.findMany({
        where: {
          labourId: id,
          date: { gte: firstDay, lte: lastDay },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.labourAdvance.findMany({
        where: {
          labourId: id,
          date: { gte: firstDay, lte: lastDay },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const presentDays = attendances.filter((a) => a.isPresent).length;
    const totalOvertimeHours = attendances.reduce(
      (sum, a) => sum + Number(a.overtimeHours),
      0,
    );
    const wagesEarned = presentDays * dailyWage;
    const overtimePay = totalOvertimeHours * overtimeRatePerHour;
    const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const netPayable = wagesEarned + overtimePay - totalAdvances;

    return {
      labour: this.mapLabour(labour),
      period: { month, year },
      summary: {
        presentDays,
        totalOvertimeHours,
        wagesEarned,
        overtimePay,
        totalAdvances,
        netPayable,
      },
      attendances: attendances.map((a) => this.mapAttendance(a)),
      advances: advances.map((a) => this.mapAdvance(a)),
    };
  }

  private mapLabour(labour: {
    id: string;
    name: string;
    phoneNumber: string | null;
    cnic: string | null;
    address: string | null;
    trade: string | null;
    dailyWage: any;
    overtimeRatePerHour: any;
    joinDate: Date;
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: labour.id,
      name: labour.name,
      phoneNumber: labour.phoneNumber,
      cnic: labour.cnic,
      address: labour.address,
      trade: labour.trade,
      dailyWage: Number(labour.dailyWage),
      overtimeRatePerHour: Number(labour.overtimeRatePerHour),
      joinDate: labour.joinDate,
      isActive: labour.isActive,
      createdAt: labour.createdAt,
    };
  }

  private mapAttendance(a: {
    id: string;
    labourId: string;
    date: Date;
    isPresent: boolean;
    overtimeHours: any;
    notes: string | null;
  }) {
    return {
      id: a.id,
      labourId: a.labourId,
      date: a.date,
      isPresent: a.isPresent,
      overtimeHours: Number(a.overtimeHours),
      notes: a.notes,
    };
  }

  private mapAdvance(a: {
    id: string;
    labourId: string;
    amount: any;
    date: Date;
    reason: string | null;
  }) {
    return {
      id: a.id,
      labourId: a.labourId,
      amount: Number(a.amount),
      date: a.date,
      reason: a.reason,
    };
  }
}
