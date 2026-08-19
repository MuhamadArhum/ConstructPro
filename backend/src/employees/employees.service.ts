import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ProcessSalaryDto,
  EmployeeQueryDto,
  CreateEmployeeAdvanceDto,
} from './dto/employee.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: EmployeeQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { fullName: { contains: query.search } },
        { designation: { contains: query.search } },
        { department: { contains: query.search } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.department) {
      where.department = { contains: query.department };
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: employees.map((e) => this.mapEmployee(e)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        salaryPayments: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 5,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return {
      ...this.mapEmployee(employee),
      salaryPayments: employee.salaryPayments.map((sp) => this.mapSalaryPayment(sp)),
    };
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'employee');
  }

  async create(dto: CreateEmployeeDto) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.employee.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'employee');
    }
    const employee = await this.prisma.employee.create({
      data: {
        code,
        fullName: dto.fullName,
        designation: dto.designation,
        department: dto.department,
        phoneNumber: dto.phoneNumber,
        cnic: dto.cnic,
        address: dto.address,
        basicSalary: Number(dto.basicSalary),
        joinDate: new Date(dto.joinDate),
      },
    });

    return this.mapEmployee(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findById(id);

    if (dto.code !== undefined) {
      const conflict = await this.prisma.employee.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.designation !== undefined && { designation: dto.designation }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.cnic !== undefined && { cnic: dto.cnic }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.basicSalary !== undefined && { basicSalary: Number(dto.basicSalary) }),
        ...(dto.joinDate !== undefined && { joinDate: new Date(dto.joinDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapEmployee(employee);
  }

  async deactivate(id: string) {
    await this.findById(id);
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });
    return this.mapEmployee(employee);
  }

  async activate(id: string) {
    await this.findById(id);
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { isActive: true },
    });
    return this.mapEmployee(employee);
  }

  async getSalaryHistory(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    const payments = await this.prisma.salaryPayment.findMany({
      where: { employeeId: id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return payments.map((sp) => ({
      ...this.mapSalaryPayment(sp),
      employeeName: employee.fullName,
    }));
  }

  async processSalary(id: string, dto: ProcessSalaryDto) {
    await this.findById(id);

    const existing = await this.prisma.salaryPayment.findFirst({
      where: { employeeId: id, month: dto.month, year: dto.year },
    });
    if (existing) {
      throw new ConflictException(`Salary for ${dto.month}/${dto.year} already processed`);
    }

    const basicSalary = Number(dto.basicSalary);
    const bonus = Number(dto.bonus ?? 0);
    const totalDays = dto.totalDays ?? 30;
    const daysPresent = dto.daysPresent ?? 0;
    const earnedSalary = totalDays > 0 ? (basicSalary / totalDays) * daysPresent : 0;

    // Auto-deduct pending advances
    const pendingAdvances = await this.prisma.employeeAdvance.findMany({
      where: { employeeId: id, isDeducted: false },
    });
    const advanceTotal = pendingAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
    const manualDeductions = Number(dto.deductions ?? 0);
    const deductions = manualDeductions + advanceTotal;

    const netSalary = Math.round((earnedSalary + bonus - deductions) * 100) / 100;

    const code = await generateCode(this.prisma, 'salaryPayment');
    const payment = await this.prisma.salaryPayment.create({
      data: {
        code,
        employeeId: id,
        month: dto.month,
        year: dto.year,
        basicSalary,
        bonus,
        deductions,
        netSalary,
        daysPresent,
        totalDays,
        remarks: dto.remarks,
      },
    });

    // Mark pending advances as deducted
    if (pendingAdvances.length > 0) {
      await this.prisma.employeeAdvance.updateMany({
        where: { id: { in: pendingAdvances.map((a) => a.id) } },
        data: { isDeducted: true, deductedAt: new Date() },
      });
    }

    return {
      ...this.mapSalaryPayment(payment),
      advanceDeducted: advanceTotal,
      manualDeductions,
    };
  }

  // ── Advances ────────────────────────────────────────────────────────────────

  async addAdvance(employeeId: string, dto: CreateEmployeeAdvanceDto) {
    await this.findById(employeeId);
    const advance = await this.prisma.employeeAdvance.create({
      data: {
        employeeId,
        amount: dto.amount,
        date: new Date(dto.date),
        reason: dto.reason,
      },
    });
    return this.mapAdvance(advance);
  }

  async getAdvances(employeeId: string) {
    await this.findById(employeeId);
    const advances = await this.prisma.employeeAdvance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
    return advances.map((a) => this.mapAdvance(a));
  }

  async deleteAdvance(employeeId: string, advanceId: string) {
    const advance = await this.prisma.employeeAdvance.findFirst({
      where: { id: advanceId, employeeId },
    });
    if (!advance) throw new NotFoundException('Advance not found');
    if (advance.isDeducted) throw new ConflictException('Cannot delete an advance that has already been deducted from salary');
    await this.prisma.employeeAdvance.delete({ where: { id: advanceId } });
    return { message: 'Advance deleted' };
  }

  async getAllSalaries(month: number, year: number) {
    const payments = await this.prisma.salaryPayment.findMany({
      where: { month, year },
      include: {
        employee: {
          select: { id: true, fullName: true, designation: true, department: true },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    return payments.map((sp) => ({
      ...this.mapSalaryPayment(sp),
      employee: sp.employee,
    }));
  }

  async getPendingAdvancesTotal(employeeId: string) {
    const advances = await this.prisma.employeeAdvance.findMany({
      where: { employeeId, isDeducted: false },
      orderBy: { date: 'desc' },
    });
    const total = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    return { advances: advances.map((a) => this.mapAdvance(a)), total };
  }

  private mapAdvance(a: {
    id: string;
    employeeId: string;
    amount: any;
    date: Date;
    reason: string | null;
    isDeducted: boolean;
    deductedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: a.id,
      employeeId: a.employeeId,
      amount: Number(a.amount),
      date: a.date,
      reason: a.reason,
      isDeducted: a.isDeducted,
      deductedAt: a.deductedAt,
      createdAt: a.createdAt,
    };
  }

  private mapEmployee(employee: {
    id: string;
    code?: string | null;
    fullName: string;
    designation: string | null;
    department: string | null;
    phoneNumber: string | null;
    cnic: string | null;
    address: string | null;
    basicSalary: any;
    joinDate: Date;
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: employee.id,
      code: employee.code ?? null,
      fullName: employee.fullName,
      designation: employee.designation,
      department: employee.department,
      phoneNumber: employee.phoneNumber,
      cnic: employee.cnic,
      address: employee.address,
      basicSalary: Number(employee.basicSalary),
      joinDate: employee.joinDate,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
    };
  }

  private mapSalaryPayment(sp: {
    id: string;
    code?: string | null;
    employeeId: string;
    month: number;
    year: number;
    basicSalary: any;
    bonus: any;
    deductions: any;
    netSalary: any;
    daysPresent: number;
    totalDays: number;
    paidAt: Date;
    remarks: string | null;
    createdAt: Date;
  }) {
    return {
      id: sp.id,
      code: sp.code ?? null,
      employeeId: sp.employeeId,
      month: sp.month,
      year: sp.year,
      basicSalary: Number(sp.basicSalary),
      bonus: Number(sp.bonus),
      deductions: Number(sp.deductions),
      netSalary: Number(sp.netSalary),
      daysPresent: sp.daysPresent,
      totalDays: sp.totalDays,
      paidAt: sp.paidAt,
      remarks: sp.remarks,
      createdAt: sp.createdAt,
    };
  }
}
