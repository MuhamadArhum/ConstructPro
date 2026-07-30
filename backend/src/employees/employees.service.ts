import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ProcessSalaryDto,
  EmployeeQueryDto,
} from './dto/employee.dto';

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
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.department) {
      where.department = { contains: query.department, mode: 'insensitive' };
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

  async create(dto: CreateEmployeeDto) {
    const employee = await this.prisma.employee.create({
      data: {
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

    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
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

    const basicSalary = Number(dto.basicSalary);
    const bonus = Number(dto.bonus ?? 0);
    const deductions = Number(dto.deductions ?? 0);
    const netSalary = basicSalary + bonus - deductions;

    const payment = await this.prisma.salaryPayment.create({
      data: {
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

  private mapEmployee(employee: {
    id: string;
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
