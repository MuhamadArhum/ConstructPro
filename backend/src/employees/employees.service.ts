import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ProcessSalaryDto,
  EmployeeQueryDto,
  BulkProcessSalaryDto,
} from './dto/employee.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: EmployeeQueryDto) {
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

    if (query.joinDateFrom || query.joinDateTo) {
      where.joinDate = {};
      if (query.joinDateFrom) where.joinDate.gte = new Date(query.joinDateFrom);
      if (query.joinDateTo) where.joinDate.lte = new Date(query.joinDateTo);
    }

    // Return all active employees without pagination (for bulk operations)
    if (query.all === true) {
      where.isActive = true;
      const employees = await this.prisma.employee.findMany({
        where,
        orderBy: { fullName: 'asc' },
      });
      return {
        items: employees.map((e) => this.mapEmployee(e)),
        totalCount: employees.length,
        pageNumber: 1,
        pageSize: employees.length,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }

    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

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
    const deductions = Number(dto.deductions ?? 0);
    const netSalary = basicSalary + bonus - deductions;

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
        daysPresent: dto.daysPresent ?? 0,
        totalDays: dto.totalDays ?? 30,
        remarks: dto.remarks,
      },
    });

    return this.mapSalaryPayment(payment);
  }

  async getSummary() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [totalActive, totalInactive, activeEmployees, paidThisMonth] = await Promise.all([
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.employee.count({ where: { isActive: false } }),
      this.prisma.employee.findMany({ where: { isActive: true }, select: { basicSalary: true } }),
      this.prisma.salaryPayment.aggregate({
        where: { month: currentMonth, year: currentYear },
        _sum: { netSalary: true },
      }),
    ]);

    const totalMonthlyBill = activeEmployees.reduce((sum, e) => sum + Number(e.basicSalary), 0);
    const totalPaidThisMonth = Number(paidThisMonth._sum.netSalary ?? 0);

    return { totalActive, totalInactive, totalMonthlyBill, totalPaidThisMonth };
  }

  async deleteSalary(salaryId: string) {
    const payment = await this.prisma.salaryPayment.findUnique({ where: { id: salaryId } });
    if (!payment) throw new NotFoundException(`Salary record ${salaryId} not found`);
    await this.prisma.salaryPayment.delete({ where: { id: salaryId } });
    return this.mapSalaryPayment(payment);
  }

  async bulkProcessSalary(dto: BulkProcessSalaryDto) {
    const errors: string[] = [];
    let processed = 0;

    for (const entry of dto.entries) {
      try {
        const employee = await this.prisma.employee.findUnique({ where: { id: entry.employeeId } });
        if (!employee) {
          errors.push(`Employee ${entry.employeeId} not found`);
          continue;
        }

        const basicSalary = Number(entry.basicSalary);
        const bonus = Number(entry.bonus ?? 0);
        const deductions = Number(entry.deductions ?? 0);
        const netSalary = basicSalary + bonus - deductions;

        const existing = await this.prisma.salaryPayment.findFirst({
          where: { employeeId: entry.employeeId, month: dto.month, year: dto.year },
        });

        if (existing) {
          await this.prisma.salaryPayment.update({
            where: { id: existing.id },
            data: {
              basicSalary,
              bonus,
              deductions,
              netSalary,
              daysPresent: entry.daysPresent ?? 0,
              totalDays: entry.totalDays ?? 30,
              remarks: entry.remarks,
            },
          });
        } else {
          const code = await generateCode(this.prisma, 'salaryPayment');
          await this.prisma.salaryPayment.create({
            data: {
              code,
              employeeId: entry.employeeId,
              month: dto.month,
              year: dto.year,
              basicSalary,
              bonus,
              deductions,
              netSalary,
              daysPresent: entry.daysPresent ?? 0,
              totalDays: entry.totalDays ?? 30,
              remarks: entry.remarks,
            },
          });
        }
        processed++;
      } catch (err: any) {
        errors.push(`Failed for employee ${entry.employeeId}: ${err?.message ?? 'Unknown error'}`);
      }
    }

    return { processed, errors };
  }

  async getAllSalaries(month: number, year: number) {
    const payments = await this.prisma.salaryPayment.findMany({
      where: { month, year },
      include: {
        employee: {
          select: { id: true, code: true, fullName: true, designation: true, department: true },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    return payments.map((sp) => ({
      ...this.mapSalaryPayment(sp),
      employee: sp.employee,
    }));
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
