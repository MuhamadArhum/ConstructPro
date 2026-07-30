import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogDto {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  succeeded?: boolean;
  errorMessage?: string;
}

export interface AuditLogQuery {
  pageNumber?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(dto: CreateAuditLogDto): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: dto.userId ?? null,
        userEmail: dto.userEmail ?? null,
        action: dto.action,
        entityType: dto.entityType ?? null,
        entityId: dto.entityId ?? null,
        oldValues: dto.oldValues ?? undefined,
        newValues: dto.newValues ?? undefined,
        ipAddress: dto.ipAddress ?? null,
        succeeded: dto.succeeded ?? true,
        errorMessage: dto.errorMessage ?? null,
      },
    });
  }

  async findAll(query: AuditLogQuery) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: logs.map((log) => ({
        ...log,
        userEmail: (log as any).userEmail ?? (log as any).user?.email ?? null,
      })),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }
}
