import { Injectable } from '@nestjs/common';
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
    if (!existing || existing.userId !== userId) return null;

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

    let generated = 0;

    // Fetch all items and filter in-memory for Decimal field comparison
    const allItems = await this.prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        currentStock: true,
        lowStockThreshold: true,
      },
    });

    const actualLowStockItems = allItems.filter(
      (item) => Number(item.currentStock) <= Number(item.lowStockThreshold),
    );

    for (const item of actualLowStockItems) {
      // Check if a notification was already created today for this item
      const existing = await this.prisma.notification.findFirst({
        where: {
          entityId: item.id,
          type: 'Warning' as any,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (!existing) {
        await this.prisma.notification.create({
          data: {
            type: 'Warning' as any,
            title: 'Low Stock Alert',
            message: `Inventory item "${item.name}" is running low. Current stock: ${Number(item.currentStock)} (threshold: ${Number(item.lowStockThreshold)})`,
            entityId: item.id,
            isRead: false,
          },
        });
        generated++;
      }
    }

    // Check machinery due for maintenance within 7 days
    const machineryDue = await this.prisma.machinery.findMany({
      where: {
        status: 'Active',
        nextMaintenanceDate: {
          lte: sevenDaysFromNow,
        },
      },
      select: {
        id: true,
        name: true,
        nextMaintenanceDate: true,
      },
    });

    for (const machinery of machineryDue) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          entityId: machinery.id,
          type: 'Alert' as any,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (!existing) {
        const dueDate = machinery.nextMaintenanceDate
          ? machinery.nextMaintenanceDate.toISOString().split('T')[0]
          : 'soon';

        await this.prisma.notification.create({
          data: {
            type: 'Alert' as any,
            title: 'Machinery Maintenance Due',
            message: `Machinery "${machinery.name}" is due for maintenance on ${dueDate}`,
            entityId: machinery.id,
            isRead: false,
          },
        });
        generated++;
      }
    }

    return { generated };
  }
}
