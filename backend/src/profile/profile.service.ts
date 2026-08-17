import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updateData: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
    } = {};

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return this.mapUser(user);
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    try {
      fs.writeFileSync(filePath, file.buffer);
    } catch (err) {
      throw new Error(`Failed to save profile picture: ${(err as Error).message}`);
    }

    const profilePicturePath = `uploads/profile-pictures/${fileName}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePicturePath },
    });

    return { profilePicturePath };
  }

  private mapUser(user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
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
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profilePicturePath: user.profilePicturePath,
      roles: user.roles.map((ur) => ur.role.name),
    };
  }
}
