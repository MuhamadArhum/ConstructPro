import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 10, isRead?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: notifications.map((n) => ({
        ...n,
        typeDisplay: n.type,
      })),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');
    if (existing.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { updated: result.count };
  }

  async generateSystemNotifications() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [allUsers, allItems, machineryDue] = await Promise.all([
      this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } }),
      this.prisma.inventoryItem.findMany({
        select: { id: true, name: true, currentStock: true, lowStockThreshold: true },
      }),
      this.prisma.machinery.findMany({
        where: { status: 'Active', nextMaintenanceDate: { lte: sevenDaysFromNow } },
        select: { id: true, name: true, nextMaintenanceDate: true },
      }),
    ]);

    const userIds = allUsers.map((u) => u.id);
    const lowStockItems = allItems.filter(
      (item) => Number(item.currentStock) <= Number(item.lowStockThreshold),
    );

    if (userIds.length === 0) return { generated: 0 };

    const lowStockIds = lowStockItems.map((i) => i.id);
    const machineryIds = machineryDue.map((m) => m.id);

    // Fetch all already-sent notifications for today in two queries (not N×M)
    const [existingWarnings, existingAlerts] = await Promise.all([
      lowStockIds.length > 0
        ? this.prisma.notification.findMany({
            where: {
              entityId: { in: lowStockIds },
              type: 'Warning',
              createdAt: { gte: todayStart, lte: todayEnd },
            },
            select: { userId: true, entityId: true },
          })
        : Promise.resolve([]),
      machineryIds.length > 0
        ? this.prisma.notification.findMany({
            where: {
              entityId: { in: machineryIds },
              type: 'Alert',
              createdAt: { gte: todayStart, lte: todayEnd },
            },
            select: { userId: true, entityId: true },
          })
        : Promise.resolve([]),
    ]);

    const sentWarnings = new Set(existingWarnings.map((n) => `${n.userId}:${n.entityId}`));
    const sentAlerts = new Set(existingAlerts.map((n) => `${n.userId}:${n.entityId}`));

    const toCreate: {
      type: string;
      title: string;
      message: string;
      entityId: string;
      userId: string;
      isRead: boolean;
    }[] = [];

    for (const item of lowStockItems) {
      for (const userId of userIds) {
        if (!sentWarnings.has(`${userId}:${item.id}`)) {
          toCreate.push({
            type: 'Warning',
            title: 'Low Stock Alert',
            message: `Inventory item "${item.name}" is running low. Current stock: ${Number(item.currentStock)} (threshold: ${Number(item.lowStockThreshold)})`,
            entityId: item.id,
            userId,
            isRead: false,
          });
        }
      }
    }

    for (const machinery of machineryDue) {
      const dueDate = machinery.nextMaintenanceDate
        ? machinery.nextMaintenanceDate.toISOString().split('T')[0]
        : 'soon';
      for (const userId of userIds) {
        if (!sentAlerts.has(`${userId}:${machinery.id}`)) {
          toCreate.push({
            type: 'Alert',
            title: 'Machinery Maintenance Due',
            message: `Machinery "${machinery.name}" is due for maintenance on ${dueDate}`,
            entityId: machinery.id,
            userId,
            isRead: false,
          });
        }
      }
    }

    if (toCreate.length > 0) {
      await this.prisma.notification.createMany({ data: toCreate });
    }

    return { generated: toCreate.length };
  }
}
