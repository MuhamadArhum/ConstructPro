import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateProjectExpenseDto,
  UpdateProjectExpenseDto,
  CreateProjectIncomeDto,
  UpdateProjectIncomeDto,
  AssignLabourDto,
  AssignMachineryDto,
  AssignVehicleDto,
  AssignPlantDto,
  AssignEmployeeDto,
} from './dto/project.dto';
import { generateCode } from '../common/utils/generate-code';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    pageSize = 10,
    search?: string,
    status?: string,
    clientId?: string,
    startDateFrom?: string,
    startDateTo?: string,
  ) {
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { siteAddress: { contains: search } },
        { managerName: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (startDateTo) where.startDate.lte = new Date(startDateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: data.map((p) => this.mapProject(p)),
      total,
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, companyName: true } },
        milestones: { orderBy: { dueDate: 'asc' } },
        expenses: { orderBy: { date: 'desc' } },
        incomes: { orderBy: { date: 'desc' } },
        labours: {
          include: { labour: { select: { id: true, name: true, trade: true, dailyWage: true } } },
        },
        machinery: {
          include: {
            machinery: { select: { id: true, name: true, model: true } },
          },
        },
        vehicles: {
          include: {
            vehicle: { select: { id: true, code: true, registrationNumber: true, make: true, model: true } },
          },
        },
        plants: {
          include: {
            plant: { select: { id: true, code: true, name: true, type: true } },
          },
        },
        employees: {
          include: {
            employee: { select: { id: true, fullName: true, designation: true, basicSalary: true } },
          },
        },
        _count: { select: { invoices: true, purchaseOrders: true } },
      },
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);

    return {
      ...this.mapProject(project),
      milestones: project.milestones.map((m) => ({ ...m })),
      expenses: project.expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
      incomes: project.incomes.map((i) => ({ ...i, amount: Number(i.amount) })),
      labours: project.labours.map((pl) => ({
        id: pl.id,
        assignedAt: pl.assignedAt,
        labour: pl.labour,
      })),
      machinery: project.machinery.map((pm) => ({
        id: pm.id,
        assignedAt: pm.assignedAt,
        machinery: pm.machinery,
      })),
      vehicles: project.vehicles.map((pv) => ({
        id: pv.id,
        assignedAt: pv.assignedAt,
        vehicle: pv.vehicle,
      })),
      plants: project.plants.map((pp) => ({
        id: pp.id,
        assignedAt: pp.assignedAt,
        plant: pp.plant,
      })),
      employees: project.employees.map((pe) => ({
        id: pe.id,
        assignedAt: pe.assignedAt,
        employee: pe.employee,
      })),
      invoicesCount: project._count.invoices,
      purchaseOrdersCount: project._count.purchaseOrders,
    };
  }

  async getNextCode(): Promise<string> {
    return generateCode(this.prisma, 'project');
  }

  async create(dto: CreateProjectDto) {
    let code: string;
    if (dto.code) {
      const existing = await this.prisma.project.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Code already in use');
      code = dto.code;
    } else {
      code = await generateCode(this.prisma, 'project');
    }
    const project = await this.prisma.project.create({
      data: {
        code,
        name: dto.name,
        description: dto.description,
        clientId: dto.clientId,
        siteAddress: dto.siteAddress,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget ?? 0,
        spent: 0,
        status: dto.status ?? 'Planning',
        progress: dto.progress ?? 0,
        managerName: dto.managerName,
        notes: dto.notes,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return this.mapProject(project);
  }

  async update(id: string, dto: UpdateProjectDto) {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Project not found');

    if (dto.code !== undefined) {
      const conflict = await this.prisma.project.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (conflict) throw new ConflictException('Code already in use');
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.clientId !== undefined && { clientId: dto.clientId }),
        ...(dto.siteAddress !== undefined && { siteAddress: dto.siteAddress }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
        ...(dto.managerName !== undefined && { managerName: dto.managerName }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return this.mapProject(project);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted successfully' };
  }

  // ── Milestones ──────────────────────────────────────────────────────────────

  async addMilestone(projectId: string, dto: CreateMilestoneDto) {
    await this.findOne(projectId);

    const milestone = await this.prisma.projectMilestone.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
      },
    });

    return milestone;
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const updated = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.isCompleted !== undefined && {
          isCompleted: dto.isCompleted,
          completedAt: dto.isCompleted ? new Date() : null,
        }),
      },
    });

    // Auto-calculate progress from milestone completion ratio
    if (dto.isCompleted !== undefined) {
      const allMilestones = await this.prisma.projectMilestone.findMany({
        where: { projectId },
        select: { isCompleted: true },
      });
      const completedCount = allMilestones.filter((m) => m.isCompleted).length;
      const progress = allMilestones.length > 0
        ? Math.round((completedCount / allMilestones.length) * 100)
        : 0;
      await this.prisma.project.update({ where: { id: projectId }, data: { progress } });
    }

    return updated;
  }

  async deleteMilestone(projectId: string, milestoneId: string) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    await this.prisma.projectMilestone.delete({ where: { id: milestoneId } });
    return { message: 'Milestone deleted successfully' };
  }

  // ── Expenses ────────────────────────────────────────────────────────────────

  async getSummary() {
    const now = new Date();
    const [projects, overdueMilestones] = await Promise.all([
      this.prisma.project.findMany({
        select: { status: true, budget: true, spent: true },
      }),
      this.prisma.projectMilestone.count({
        where: { isCompleted: false, dueDate: { lt: now } },
      }),
    ]);

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'Active').length;
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget), 0);
    const totalSpent = projects.reduce((s, p) => s + Number(p.spent), 0);

    return { totalProjects, activeProjects, totalBudget, totalSpent, overdueMilestones };
  }

  async addExpense(projectId: string, dto: CreateProjectExpenseDto) {
    await this.findOne(projectId);

    const expense = await this.prisma.projectExpense.create({
      data: {
        projectId,
        category: dto.category,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
      },
    });

    await this.syncSpent(projectId);

    return { ...expense, amount: Number(expense.amount) };
  }

  async updateExpense(projectId: string, expenseId: string, dto: UpdateProjectExpenseDto) {
    const expense = await this.prisma.projectExpense.findFirst({
      where: { id: expenseId, projectId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    const updated = await this.prisma.projectExpense.update({
      where: { id: expenseId },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    await this.syncSpent(projectId);
    return { ...updated, amount: Number(updated.amount) };
  }

  async deleteExpense(projectId: string, expenseId: string) {
    const expense = await this.prisma.projectExpense.findFirst({
      where: { id: expenseId, projectId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    await this.prisma.projectExpense.delete({ where: { id: expenseId } });
    await this.syncSpent(projectId);

    return { message: 'Expense deleted successfully' };
  }

  private async syncSpent(projectId: string) {
    const agg = await this.prisma.projectExpense.aggregate({
      _sum: { amount: true },
      where: { projectId },
    });
    const spent = Number(agg._sum.amount ?? 0);
    await this.prisma.project.update({ where: { id: projectId }, data: { spent } });
  }

  // ── Project Income ──────────────────────────────────────────────────────────

  async addIncome(projectId: string, dto: CreateProjectIncomeDto) {
    await this.findOne(projectId);
    const income = await this.prisma.projectIncome.create({
      data: {
        projectId,
        category: dto.category,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        source: dto.source,
      },
    });
    return { ...income, amount: Number(income.amount) };
  }

  async updateIncome(projectId: string, incomeId: string, dto: UpdateProjectIncomeDto) {
    const income = await this.prisma.projectIncome.findFirst({ where: { id: incomeId, projectId } });
    if (!income) throw new NotFoundException('Income not found');
    const updated = await this.prisma.projectIncome.update({
      where: { id: incomeId },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.source !== undefined && { source: dto.source }),
      },
    });
    return { ...updated, amount: Number(updated.amount) };
  }

  async deleteIncome(projectId: string, incomeId: string) {
    const income = await this.prisma.projectIncome.findFirst({ where: { id: incomeId, projectId } });
    if (!income) throw new NotFoundException('Income not found');
    await this.prisma.projectIncome.delete({ where: { id: incomeId } });
    return { message: 'Income deleted successfully' };
  }

  // ── P&L ─────────────────────────────────────────────────────────────────────

  async getPnL(projectId: string, month?: number, year?: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        expenses: true,
        incomes: true,
        labours: {
          include: { labour: { select: { id: true, name: true, trade: true, dailyWage: true, overtimeRatePerHour: true } } },
        },
        employees: {
          include: { employee: { select: { id: true, fullName: true, basicSalary: true } } },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (month && year) {
      dateFilter = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59) };
    }

    const expenses = project.expenses.filter((e) =>
      dateFilter ? e.date >= dateFilter.gte! && e.date <= dateFilter.lte! : true,
    );
    const incomes = project.incomes.filter((i) =>
      dateFilter ? i.date >= dateFilter.gte! && i.date <= dateFilter.lte! : true,
    );

    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalDirectExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

    // Labour wages from attendance
    const labourWages = await Promise.all(
      project.labours.map(async (pl) => {
        const where: any = { labourId: pl.labour.id };
        if (dateFilter) where.date = dateFilter;
        const attendances = await this.prisma.labourAttendance.findMany({ where });
        const presentDays = attendances.filter((a) => a.isPresent).length;
        const overtimeHours = attendances.reduce((s, a) => s + Number(a.overtimeHours), 0);
        const wage = presentDays * Number(pl.labour.dailyWage) + overtimeHours * Number(pl.labour.overtimeRatePerHour);
        return wage;
      }),
    );
    const totalLabourCost = labourWages.reduce((s, w) => s + w, 0);

    // Employee salaries
    const empIds = project.employees.map((pe) => pe.employee.id);
    const salaryFilter: any = { employeeId: { in: empIds } };
    if (month && year) { salaryFilter.month = month; salaryFilter.year = year; }
    const salaries = empIds.length > 0
      ? await this.prisma.salaryPayment.findMany({ where: salaryFilter })
      : [];
    const totalSalaryCost = salaries.reduce((s, sal) => s + Number(sal.netSalary), 0);

    const totalCost = totalDirectExpenses + totalLabourCost + totalSalaryCost;
    const grossProfit = totalIncome - totalCost;

    return {
      period: month && year ? { month, year } : { from: project.startDate, to: project.endDate ?? new Date() },
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalDirectExpenses: Math.round(totalDirectExpenses * 100) / 100,
      totalLabourCost: Math.round(totalLabourCost * 100) / 100,
      totalSalaryCost: Math.round(totalSalaryCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      isProfitable: grossProfit >= 0,
      incomeBreakdown: incomes.map((i) => ({ category: i.category, amount: Number(i.amount), date: i.date, description: i.description })),
      expenseBreakdown: expenses.map((e) => ({ category: e.category, amount: Number(e.amount), date: e.date, description: e.description })),
    };
  }

  // ── Labour ──────────────────────────────────────────────────────────────────

  async assignLabour(projectId: string, dto: AssignLabourDto) {
    await this.findOne(projectId);

    try {
      const record = await this.prisma.projectLabour.create({
        data: { projectId, labourId: dto.labourId },
        include: { labour: { select: { id: true, name: true } } },
      });
      return record;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Labour already assigned to this project');
      }
      throw err;
    }
  }

  async removeLabour(projectId: string, labourId: string) {
    const record = await this.prisma.projectLabour.findFirst({
      where: { projectId, labourId },
    });
    if (!record) throw new NotFoundException('Labour assignment not found');

    await this.prisma.projectLabour.delete({ where: { id: record.id } });
    return { message: 'Labour removed from project' };
  }

  // ── Employees ───────────────────────────────────────────────────────────────

  async assignEmployee(projectId: string, dto: AssignEmployeeDto) {
    await this.findOne(projectId);

    try {
      const record = await this.prisma.projectEmployee.create({
        data: { projectId, employeeId: dto.employeeId },
        include: { employee: { select: { id: true, fullName: true } } },
      });
      return record;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Employee already assigned to this project');
      }
      throw err;
    }
  }

  async removeEmployee(projectId: string, employeeId: string) {
    const record = await this.prisma.projectEmployee.findFirst({
      where: { projectId, employeeId },
    });
    if (!record) throw new NotFoundException('Employee assignment not found');

    await this.prisma.projectEmployee.delete({ where: { id: record.id } });
    return { message: 'Employee removed from project' };
  }

  // ── Machinery ───────────────────────────────────────────────────────────────

  async assignMachinery(projectId: string, dto: AssignMachineryDto) {
    await this.findOne(projectId);

    try {
      const record = await this.prisma.projectMachinery.create({
        data: { projectId, machineryId: dto.machineryId },
        include: { machinery: { select: { id: true, name: true } } },
      });
      return record;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'Machinery already assigned to this project',
        );
      }
      throw err;
    }
  }

  async removeMachinery(projectId: string, machineryId: string) {
    const record = await this.prisma.projectMachinery.findFirst({
      where: { projectId, machineryId },
    });
    if (!record) throw new NotFoundException('Machinery assignment not found');

    await this.prisma.projectMachinery.delete({ where: { id: record.id } });
    return { message: 'Machinery removed from project' };
  }

  // ── Vehicles ─────────────────────────────────────────────────────────────────

  async assignVehicle(projectId: string, dto: AssignVehicleDto) {
    await this.findOne(projectId);
    try {
      const record = await this.prisma.projectVehicle.create({
        data: { projectId, vehicleId: dto.vehicleId },
        include: { vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } } },
      });
      return record;
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('Vehicle already assigned to this project');
      throw err;
    }
  }

  async removeVehicle(projectId: string, vehicleId: string) {
    const record = await this.prisma.projectVehicle.findFirst({ where: { projectId, vehicleId } });
    if (!record) throw new NotFoundException('Vehicle assignment not found');
    await this.prisma.projectVehicle.delete({ where: { id: record.id } });
    return { message: 'Vehicle removed from project' };
  }

  // ── Plants ───────────────────────────────────────────────────────────────────

  async assignPlant(projectId: string, dto: AssignPlantDto) {
    await this.findOne(projectId);
    try {
      const record = await this.prisma.projectPlant.create({
        data: { projectId, plantId: dto.plantId },
        include: { plant: { select: { id: true, name: true, type: true } } },
      });
      return record;
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('Plant already assigned to this project');
      throw err;
    }
  }

  async removePlant(projectId: string, plantId: string) {
    const record = await this.prisma.projectPlant.findFirst({ where: { projectId, plantId } });
    if (!record) throw new NotFoundException('Plant assignment not found');
    await this.prisma.projectPlant.delete({ where: { id: record.id } });
    return { message: 'Plant removed from project' };
  }

  // ── Salary Expense ──────────────────────────────────────────────────────────

  async getProjectSalaryExpense(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        employees: {
          include: {
            employee: { select: { id: true, fullName: true, designation: true, basicSalary: true } },
          },
        },
        labours: {
          include: {
            labour: { select: { id: true, name: true, trade: true, dailyWage: true, overtimeRatePerHour: true } },
          },
        },
      },
    });

    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const from = project.startDate;
    const to = project.endDate ?? new Date();

    // Employee salary payments within project dates
    const employeeResults = await Promise.all(
      project.employees.map(async (pe) => {
        const payments = await this.prisma.salaryPayment.findMany({
          where: {
            employeeId: pe.employee.id,
            paidAt: { gte: from, lte: to },
          },
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        });
        const totalSalary = payments.reduce((sum, p) => sum + Number(p.netSalary), 0);
        return {
          id: pe.employee.id,
          fullName: pe.employee.fullName,
          designation: pe.employee.designation,
          basicSalary: Number(pe.employee.basicSalary),
          assignedAt: pe.assignedAt,
          monthsCount: payments.length,
          totalSalary,
          payments: payments.map((p) => ({
            month: p.month,
            year: p.year,
            netSalary: Number(p.netSalary),
            daysPresent: p.daysPresent,
            totalDays: p.totalDays,
            paidAt: p.paidAt,
          })),
        };
      }),
    );

    // Labour wages from attendance within project dates
    const labourResults = await Promise.all(
      project.labours.map(async (pl) => {
        const dailyWage = Number(pl.labour.dailyWage);
        const overtimeRate = Number(pl.labour.overtimeRatePerHour);

        const attendances = await this.prisma.labourAttendance.findMany({
          where: {
            labourId: pl.labour.id,
            date: { gte: from, lte: to },
          },
        });

        const presentDays = attendances.filter((a) => a.isPresent).length;
        const totalOvertimeHours = attendances.reduce((sum, a) => sum + Number(a.overtimeHours), 0);
        const wagesEarned = presentDays * dailyWage;
        const overtimePay = totalOvertimeHours * overtimeRate;
        const totalWages = wagesEarned + overtimePay;

        return {
          id: pl.labour.id,
          name: pl.labour.name,
          trade: pl.labour.trade,
          dailyWage,
          assignedAt: pl.assignedAt,
          presentDays,
          totalOvertimeHours,
          wagesEarned,
          overtimePay,
          totalWages,
        };
      }),
    );

    const totalEmployeeSalary = employeeResults.reduce((s, e) => s + e.totalSalary, 0);
    const totalLabourWages = labourResults.reduce((s, l) => s + l.totalWages, 0);

    return {
      period: { from, to },
      employees: employeeResults,
      labours: labourResults,
      summary: {
        totalEmployeeSalary,
        totalLabourWages,
        grandTotal: totalEmployeeSalary + totalLabourWages,
      },
    };
  }

  // ── Project Payroll ─────────────────────────────────────────────────────────

  async getProjectPayroll(projectId: string, month: number, year: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        employees: {
          include: {
            employee: { select: { id: true, fullName: true, designation: true, basicSalary: true } },
          },
        },
        labours: {
          include: {
            labour: { select: { id: true, name: true, trade: true, dailyWage: true, overtimeRatePerHour: true } },
          },
        },
      },
    });

    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const employeeIds = project.employees.map((pe) => pe.employee.id);
    const salaryRecords = employeeIds.length > 0
      ? await this.prisma.salaryPayment.findMany({
          where: { employeeId: { in: employeeIds }, month, year },
        })
      : [];
    const salaryMap = new Map(salaryRecords.map((s) => [s.employeeId, s]));

    const employees = project.employees.map((pe) => {
      const sp = salaryMap.get(pe.employee.id);
      return {
        employeeId: pe.employee.id,
        fullName: pe.employee.fullName,
        designation: pe.employee.designation,
        basicSalary: Number(pe.employee.basicSalary),
        salary: sp
          ? {
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
              status: sp.status,
              generatedAt: sp.paidAt,
              paidDate: sp.paidDate,
              remarks: sp.remarks,
            }
          : null,
      };
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const labours = await Promise.all(
      project.labours.map(async (pl) => {
        const lab = pl.labour;
        const dailyWage = Number(lab.dailyWage);
        const overtimeRate = Number(lab.overtimeRatePerHour);

        const attendances = await this.prisma.labourAttendance.findMany({
          where: { labourId: lab.id, date: { gte: startDate, lte: endDate } },
        });

        const daysPresent = attendances.filter((a) => a.isPresent).length;
        const overtimeHours = attendances.reduce((s, a) => s + Number(a.overtimeHours), 0);
        const wagesEarned = daysPresent * dailyWage;
        const overtimePay = overtimeHours * overtimeRate;

        return {
          labourId: lab.id,
          name: lab.name,
          trade: lab.trade,
          dailyWage,
          daysPresent,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          wagesEarned: Math.round(wagesEarned * 100) / 100,
          overtimePay: Math.round(overtimePay * 100) / 100,
          totalWages: Math.round((wagesEarned + overtimePay) * 100) / 100,
        };
      }),
    );

    return { month, year, employees, labours };
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  async getStats(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            milestones: true,
            expenses: true,
            labours: true,
            machinery: true,
            employees: true,
          },
        },
        milestones: { select: { isCompleted: true } },
      },
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);

    const completedMilestones = project.milestones.filter(
      (m) => m.isCompleted,
    ).length;

    return {
      budget: Number(project.budget),
      spent: Number(project.spent),
      remaining: Number(project.budget) - Number(project.spent),
      progress: project.progress,
      milestoneCount: project._count.milestones,
      completedMilestones,
      labourCount: project._count.labours,
      machineryCount: project._count.machinery,
      employeeCount: project._count.employees,
      expenseCount: project._count.expenses,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private mapProject(project: any) {
    return {
      id: project.id,
      code: project.code ?? null,
      name: project.name,
      description: project.description,
      clientId: project.clientId,
      clientName: project.client?.name ?? null,
      client: project.client ?? null,
      siteAddress: project.siteAddress,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: Number(project.budget),
      spent: Number(project.spent),
      status: project.status,
      progress: project.progress,
      managerName: project.managerName,
      notes: project.notes,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
