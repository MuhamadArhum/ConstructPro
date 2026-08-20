import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLabourDto,
  UpdateLabourDto,
  UpsertAttendanceDto,
  BulkUpsertAttendanceDto,
  AddAdvanceDto,
  LabourQueryDto,
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

  async getPendingAdvances(id: string) {
    await this.findById(id);
    const advances = await this.prisma.labourAdvance.findMany({
      where: { labourId: id, isDeducted: false },
      orderBy: { date: 'desc' },
    });
    const total = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    return { advances: advances.map((a) => this.mapAdvance(a)), total };
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

  async deleteAdvance(labourId: string, advanceId: string) {
    const advance = await this.prisma.labourAdvance.findFirst({
      where: { id: advanceId, labourId },
    });
    if (!advance) throw new NotFoundException('Advance not found');
    if (advance.isDeducted) throw new ConflictException('Cannot delete an advance that has already been deducted');
    await this.prisma.labourAdvance.delete({ where: { id: advanceId } });
    return { message: 'Advance deleted' };
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
        where: { labourId: id, isDeducted: false },
        orderBy: { date: 'desc' },
      }),
      this.prisma.labourAdvance.aggregate({
        _sum: { amount: true },
        where: { labourId: id, isDeducted: false },
      }),
    ]);

    const presentDays = attendances.filter((a) => a.isPresent).length;
    const totalOvertimeHours = attendances.reduce(
      (sum, a) => sum + Number(a.overtimeHours),
      0,
    );
    const wagesEarned = presentDays * dailyWage;
    const overtimePay = totalOvertimeHours * overtimeRatePerHour;
    const totalAdvances = Number(advanceSum._sum?.amount ?? 0);
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

  async getWagePayments(labourId: string) {
    await this.findById(labourId);
    const payments = await this.prisma.labourWagePayment.findMany({
      where: { labourId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return payments.map((p) => this.mapWagePayment(p));
  }

  async settleWages(labourId: string, month: number, year: number, remarks?: string) {
    const labour = await this.prisma.labour.findUnique({ where: { id: labourId } });
    if (!labour) throw new NotFoundException(`Labour with id ${labourId} not found`);

    const existing = await this.prisma.labourWagePayment.findUnique({
      where: { labourId_month_year: { labourId, month, year } },
    });
    if (existing) throw new ConflictException(`Wages for ${month}/${year} already settled`);

    const dailyWage = Number(labour.dailyWage);
    const overtimeRatePerHour = Number(labour.overtimeRatePerHour);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

    const [attendances, pendingAdvances] = await Promise.all([
      this.prisma.labourAttendance.findMany({
        where: { labourId, date: { gte: firstDay, lte: lastDay } },
      }),
      this.prisma.labourAdvance.findMany({
        where: { labourId, isDeducted: false },
      }),
    ]);

    const daysPresent = attendances.filter((a) => a.isPresent).length;
    const totalOT = attendances.reduce((s, a) => s + Number(a.overtimeHours), 0);
    const wagesEarned = daysPresent * dailyWage;
    const overtimePay = totalOT * overtimeRatePerHour;
    const advanceDeductions = pendingAdvances.reduce((s, a) => s + Number(a.amount), 0);
    const netPayable = Math.round((wagesEarned + overtimePay - advanceDeductions) * 100) / 100;

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.labourWagePayment.create({
        data: {
          labourId,
          month,
          year,
          daysPresent,
          wagesEarned,
          overtimePay,
          advanceDeductions,
          netPayable,
          status: 'Generated',
          remarks: remarks ?? null,
        },
      });
      if (pendingAdvances.length > 0) {
        await tx.labourAdvance.updateMany({
          where: { id: { in: pendingAdvances.map((a) => a.id) } },
          data: { isDeducted: true, deductedAt: new Date() },
        });
      }
      return p;
    });

    return this.mapWagePayment(payment);
  }

  async markWageAsPaid(labourId: string, paymentId: string, paidDate: string) {
    const payment = await this.prisma.labourWagePayment.findFirst({
      where: { id: paymentId, labourId },
    });
    if (!payment) throw new NotFoundException('Wage payment not found');
    if (payment.status === 'Paid') throw new ConflictException('Already marked as paid');

    const updated = await this.prisma.labourWagePayment.update({
      where: { id: paymentId },
      data: { status: 'Paid', paidDate: new Date(paidDate) },
    });
    return this.mapWagePayment(updated);
  }

  async deleteWagePayment(labourId: string, paymentId: string) {
    const payment = await this.prisma.labourWagePayment.findFirst({
      where: { id: paymentId, labourId },
    });
    if (!payment) throw new NotFoundException('Wage payment not found');

    if (payment.status === 'Generated') {
      // Restore advances that were deducted when this settlement was created
      await this.prisma.labourAdvance.updateMany({
        where: {
          labourId,
          isDeducted: true,
          deductedAt: { gte: payment.createdAt },
        },
        data: { isDeducted: false, deductedAt: null },
      });
    }

    await this.prisma.labourWagePayment.delete({ where: { id: paymentId } });
    return { message: 'Wage payment deleted' };
  }

  private mapWagePayment(p: {
    id: string;
    labourId: string;
    month: number;
    year: number;
    daysPresent: number;
    wagesEarned: any;
    overtimePay: any;
    advanceDeductions: any;
    netPayable: any;
    status: string;
    paidDate: Date | null;
    remarks: string | null;
    createdAt: Date;
  }) {
    return {
      id: p.id,
      labourId: p.labourId,
      month: p.month,
      year: p.year,
      daysPresent: p.daysPresent,
      wagesEarned: Number(p.wagesEarned),
      overtimePay: Number(p.overtimePay),
      advanceDeductions: Number(p.advanceDeductions),
      netPayable: Number(p.netPayable),
      status: p.status,
      paidDate: p.paidDate,
      remarks: p.remarks,
      createdAt: p.createdAt,
    };
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
    isDeducted: boolean;
    deductedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: a.id,
      labourId: a.labourId,
      amount: Number(a.amount),
      date: a.date,
      reason: a.reason,
      isDeducted: a.isDeducted,
      deductedAt: a.deductedAt,
      createdAt: a.createdAt,
    };
  }
}
