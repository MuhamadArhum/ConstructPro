import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLabourDto,
  UpdateLabourDto,
  UpsertAttendanceDto,
  BulkUpsertAttendanceDto,
  AddAdvanceDto,
  LabourQueryDto,
  AssignLabourToProjectDto,
} from './dto/labour.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class LabourService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LabourQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
        { trade: { contains: query.search } },
        { phoneNumber: { contains: query.search } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.trade) {
      where.trade = { contains: query.trade };
    }

    if (query.joinDateFrom || query.joinDateTo) {
      where.joinDate = {};
      if (query.joinDateFrom) where.joinDate.gte = new Date(query.joinDateFrom);
      if (query.joinDateTo) where.joinDate.lte = new Date(query.joinDateTo + 'T23:59:59.999Z');
    }

    const [labours, total] = await Promise.all([
      this.prisma.labour.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          advances: { select: { amount: true } },
        },
      }),
      this.prisma.labour.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: labours.map(({ advances, ...l }) => ({
        ...this.mapLabour(l),
        totalAdvances: advances.reduce((sum, a) => sum + Number(a.amount), 0),
      })),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const labour = await this.prisma.labour.findUnique({ where: { id } });

    if (!labour) {
      throw new NotFoundException(`Labour with id ${id} not found`);
    }

    return this.mapLabour(labour);
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'labour');
  }

  async create(dto: CreateLabourDto) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.labour.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'labour');
    }
    const labour = await this.prisma.labour.create({
      data: {
        code,
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

    if (dto.code !== undefined) {
      const conflict = await this.prisma.labour.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const labour = await this.prisma.labour.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
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

  async activate(id: string) {
    await this.findById(id);
    const labour = await this.prisma.labour.update({
      where: { id },
      data: { isActive: true },
    });
    return this.mapLabour(labour);
  }

  async getAttendance(id: string, month: number, year: number) {
    const labour = await this.prisma.labour.findUnique({ where: { id } });

    if (!labour) {
      throw new NotFoundException(`Labour with id ${id} not found`);
    }

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

    const dailyWage = Number(labour.dailyWage);
    const overtimeRatePerHour = Number(labour.overtimeRatePerHour);

    return attendances.map((a) => {
      const overtimeHours = Number(a.overtimeHours);
      const overtimePay = overtimeHours * overtimeRatePerHour;
      const totalPay = a.isPresent ? dailyWage + overtimePay : 0;
      return {
        ...this.mapAttendance(a),
        labourName: labour.name,
        dailyWage,
        overtimePay,
        totalPay,
      };
    });
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

  async bulkUpsertAttendance(dto: BulkUpsertAttendanceDto) {
    if (!dto.records || dto.records.length === 0) {
      return { saved: 0 };
    }

    const labourIds = [...new Set(dto.records.map((r) => r.labourId))];
    const existing = await this.prisma.labour.findMany({
      where: { id: { in: labourIds } },
      select: { id: true },
    });
    const foundIds = new Set(existing.map((l) => l.id));
    const missing = labourIds.find((id) => !foundIds.has(id));
    if (missing) throw new NotFoundException(`Labour with id ${missing} not found`);

    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.labourAttendance.upsert({
          where: { labourId_date: { labourId: r.labourId, date: new Date(r.date) } },
          update: { isPresent: r.isPresent, overtimeHours: Number(r.overtimeHours ?? 0), notes: r.notes },
          create: {
            labourId: r.labourId,
            date: new Date(r.date),
            isPresent: r.isPresent,
            overtimeHours: Number(r.overtimeHours ?? 0),
            notes: r.notes,
          },
        }),
      ),
    );

    return { saved: dto.records.length };
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

    if (Number(dto.amount) <= 0) {
      throw new BadRequestException('Advance amount must be greater than zero');
    }

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

    const [attendances, advances, advanceSum] = await Promise.all([
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
      this.prisma.labourAdvance.aggregate({
        _sum: { amount: true },
        where: { labourId: id, date: { gte: firstDay, lte: lastDay } },
      }),
    ]);

    const presentDays = attendances.filter((a) => a.isPresent).length;
    const totalOvertimeHours = attendances.reduce(
      (sum, a) => sum + Number(a.overtimeHours),
      0,
    );
    const wagesEarned = presentDays * dailyWage;
    const overtimePay = totalOvertimeHours * overtimeRatePerHour;
    const totalAdvances = Number(advanceSum._sum.amount ?? 0);
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

  async getSummary() {
    const [activeCount, inactiveCount, wageBillResult, advancesResult] = await Promise.all([
      this.prisma.labour.count({ where: { isActive: true } }),
      this.prisma.labour.count({ where: { isActive: false } }),
      this.prisma.labour.aggregate({ _sum: { dailyWage: true }, where: { isActive: true } }),
      this.prisma.labourAdvance.aggregate({ _sum: { amount: true } }),
    ]);

    return {
      totalActive: activeCount,
      totalInactive: inactiveCount,
      totalDailyWageBill: Number(wageBillResult._sum.dailyWage ?? 0),
      totalPendingAdvances: Number(advancesResult._sum.amount ?? 0),
    };
  }

  async getAttendanceByDate(date: string) {
    const dateValue = new Date(date);
    const nextDay = new Date(dateValue);
    nextDay.setDate(nextDay.getDate() + 1);

    const labours = await this.prisma.labour.findMany({
      where: { isActive: true },
      include: {
        attendances: {
          where: { date: { gte: dateValue, lt: nextDay } },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return labours.map((l) => {
      const att = l.attendances[0] ?? null;
      return {
        labourId: l.id,
        labourName: l.name,
        labourCode: l.code,
        trade: l.trade,
        dailyWage: Number(l.dailyWage),
        overtimeRatePerHour: Number(l.overtimeRatePerHour),
        attendance: att
          ? {
              id: att.id,
              isPresent: att.isPresent,
              overtimeHours: Number(att.overtimeHours),
              notes: att.notes,
            }
          : null,
      };
    });
  }

  async deleteAdvance(advanceId: string) {
    const advance = await this.prisma.labourAdvance.findUnique({ where: { id: advanceId } });
    if (!advance) throw new NotFoundException(`Advance with id ${advanceId} not found`);
    await this.prisma.labourAdvance.delete({ where: { id: advanceId } });
    return { deleted: true };
  }

  async getPayrollSummary(month: number, year: number) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

    const labours = await this.prisma.labour.findMany({
      where: { isActive: true },
      include: {
        attendances: {
          where: { date: { gte: firstDay, lte: lastDay } },
        },
        advances: {
          where: { date: { gte: firstDay, lte: lastDay } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return labours.map((l) => {
      const dailyWage = Number(l.dailyWage);
      const otRate = Number(l.overtimeRatePerHour);
      const presentDays = l.attendances.filter((a) => a.isPresent).length;
      const totalOTHours = l.attendances.reduce((sum, a) => sum + Number(a.overtimeHours), 0);
      const wagesEarned = presentDays * dailyWage;
      const overtimePay = totalOTHours * otRate;
      const totalAdvances = l.advances.reduce((sum, a) => sum + Number(a.amount), 0);
      const netPayable = wagesEarned + overtimePay - totalAdvances;

      return {
        labourId: l.id,
        labourCode: l.code,
        name: l.name,
        trade: l.trade,
        presentDays,
        wagesEarned,
        overtimePay,
        totalAdvances,
        netPayable,
      };
    });
  }

  async getLabourProjects(labourId: string) {
    await this.findById(labourId);
    const assignments = await this.prisma.projectLabour.findMany({
      where: { labourId },
      include: { project: { select: { id: true, name: true, code: true, status: true } } },
      orderBy: { assignedAt: 'desc' },
    });
    return assignments.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      projectName: a.project.name,
      projectCode: a.project.code,
      projectStatus: a.project.status,
      assignedAt: a.assignedAt,
    }));
  }

  async assignLabourToProject(labourId: string, dto: AssignLabourToProjectDto) {
    await this.findById(labourId);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException(`Project with id ${dto.projectId} not found`);

    const existing = await this.prisma.projectLabour.findUnique({
      where: { projectId_labourId: { projectId: dto.projectId, labourId } },
    });
    if (existing) throw new ConflictException('Labour is already assigned to this project');

    const assignment = await this.prisma.projectLabour.create({
      data: { projectId: dto.projectId, labourId },
      include: { project: { select: { id: true, name: true, code: true, status: true } } },
    });

    return {
      id: assignment.id,
      projectId: assignment.projectId,
      projectName: assignment.project.name,
      projectCode: assignment.project.code,
      projectStatus: assignment.project.status,
      assignedAt: assignment.assignedAt,
    };
  }

  async removeLabourFromProject(labourId: string, projectId: string) {
    const assignment = await this.prisma.projectLabour.findUnique({
      where: { projectId_labourId: { projectId, labourId } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.projectLabour.delete({
      where: { projectId_labourId: { projectId, labourId } },
    });
    return { deleted: true };
  }

  private mapLabour(labour: {
    id: string;
    code?: string | null;
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
      code: labour.code ?? null,
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
