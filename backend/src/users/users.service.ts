import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AdminResetPasswordDto,
  UserQueryDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const page = query.pageNumber ?? 1;
    const limit = query.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          roles: {
            include: { role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const pageNumber = page;
    const pageSize = limit;

    return {
      items: users.map((u) => this.mapUser(u)),
      totalCount: total,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.mapUser(user);
  }

  private async resolveRoleIds(dto: { role?: string; roleIds?: string[] }): Promise<string[]> {
    if (dto.roleIds && dto.roleIds.length > 0) return dto.roleIds;
    if (dto.role) {
      const found = await this.prisma.role.findFirst({ where: { name: dto.role } });
      if (found) return [found.id];
    }
    return [];
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const roleIds = await this.resolveRoleIds(dto);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        ...(roleIds.length > 0
          ? {
              roles: {
                createMany: {
                  data: roleIds.map((roleId) => ({ roleId })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return this.mapUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    const updateData: {
      fullName?: string;
      email?: string;
      isActive?: boolean;
    } = {};

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.role !== undefined || dto.roleIds !== undefined) {
      const roleIds = await this.resolveRoleIds(dto);
      await this.prisma.userRole.deleteMany({ where: { userId: id } });

      if (roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return this.mapUser(user);
  }

  async deactivate(id: string) {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return this.mapUser(user);
  }

  async adminResetPassword(id: string, dto: AdminResetPasswordDto) {
    await this.findById(id);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  private mapUser(user: {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
    profilePicturePath: string | null;
    roles: Array<{ role: { id: string; name: string } }>;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profilePicturePath: user.profilePicturePath,
      roles: user.roles.map((ur) => ur.role.name),
    };
  }
}
