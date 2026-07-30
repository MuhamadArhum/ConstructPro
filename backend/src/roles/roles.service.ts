import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, AssignPermissionsDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => this.mapRole(role));
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    return this.mapRole(role);
  }

  async create(dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: { name: dto.name },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return this.mapRole(role);
  }

  async delete(id: string) {
    await this.findById(id);

    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException('Cannot delete role with assigned users');
    }

    await this.prisma.role.delete({ where: { id } });

    return { message: 'Role deleted successfully' };
  }

  async getPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return permissions;
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    await this.findById(roleId);

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    if (dto.permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) throw new NotFoundException('Role not found');
    return this.mapRole(role);
  }

  private mapRole(role: {
    id: string;
    name: string;
    permissions: Array<{
      permission: {
        id: string;
        module: string;
        action: string;
        code: string;
        description: string | null;
      };
    }>;
  }) {
    const systemRoles = ['Admin', 'Accountant', 'Manager', 'DataEntryOperator'];

    return {
      id: role.id,
      name: role.name,
      isSystemRole: systemRoles.includes(role.name),
      permissionCodes: role.permissions.map((rp) => rp.permission.code),
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        code: rp.permission.code,
        description: rp.permission.description,
      })),
    };
  }
}
