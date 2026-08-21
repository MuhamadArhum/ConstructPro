import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByType(type: 'expense' | 'income') {
    const cats = await this.prisma.userCategory.findMany({
      where: { type },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    return cats;
  }

  async create(type: 'expense' | 'income', name: string) {
    const trimmed = name.trim();
    const existing = await this.prisma.userCategory.findFirst({ where: { type, name: trimmed } });
    if (existing) throw new ConflictException('Category already exists');
    return this.prisma.userCategory.create({
      data: { type, name: trimmed, isSystem: false },
    });
  }

  async remove(id: string) {
    const cat = await this.prisma.userCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.isSystem) throw new ConflictException('System categories cannot be deleted');
    await this.prisma.userCategory.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
