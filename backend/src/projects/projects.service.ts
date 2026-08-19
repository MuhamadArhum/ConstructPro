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
  AssignLabourDto,
  AssignMachineryDto,
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
        labours: {
          include: { labour: { select: { id: true, name: true, trade: true } } },
        },
        machinery: {
          include: {
            machinery: { select: { id: true, name: true, model: true } },
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
      milestones: project.milestones.map((m) => ({
        ...m,
      })),
      expenses: project.expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
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
