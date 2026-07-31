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
  AssignLabourDto,
  AssignMachineryDto,
} from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    pageSize = 10,
    search?: string,
    status?: string,
  ) {
    try {
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { siteAddress: { contains: search, mode: 'insensitive' } },
          { managerName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
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
    } catch {
      return { data: [], total: 0 };
    }
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
      invoicesCount: project._count.invoices,
      purchaseOrdersCount: project._count.purchaseOrders,
    };
  }

  async create(dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
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
    await this.findOne(id);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
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

  async addExpense(projectId: string, dto: CreateProjectExpenseDto) {
    await this.findOne(projectId);

    const [expense] = await this.prisma.$transaction([
      this.prisma.projectExpense.create({
        data: {
          projectId,
          category: dto.category,
          amount: dto.amount,
          date: new Date(dto.date),
          description: dto.description,
        },
      }),
      this.prisma.project.update({
        where: { id: projectId },
        data: { spent: { increment: dto.amount } },
      }),
    ]);

    return { ...expense, amount: Number(expense.amount) };
  }

  async deleteExpense(projectId: string, expenseId: string) {
    const expense = await this.prisma.projectExpense.findFirst({
      where: { id: expenseId, projectId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    await this.prisma.$transaction([
      this.prisma.projectExpense.delete({ where: { id: expenseId } }),
      this.prisma.project.update({
        where: { id: projectId },
        data: { spent: { decrement: Number(expense.amount) } },
      }),
    ]);

    return { message: 'Expense deleted successfully' };
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
      expenseCount: project._count.expenses,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private mapProject(project: any) {
    return {
      id: project.id,
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
