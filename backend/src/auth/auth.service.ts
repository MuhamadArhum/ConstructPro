import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    if (user.lockoutEnd && user.lockoutEnd > new Date()) {
      throw new UnauthorizedException('Account is locked. Try again later.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.handleFailedLogin(user.id, user.accessFailedCount);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { accessFailedCount: 0, lockoutEnd: null, lastLoginAt: new Date() },
    });

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code))),
    ];

    const accessToken = this.generateAccessToken(user.id, user.email, roles, permissions);
    const refreshToken = await this.generateRefreshToken(user.id, dto.rememberMe);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: { id: user.id, fullName: user.fullName, email: user.email, roles, permissions, profilePicturePath: user.profilePicturePath },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
          },
        },
      },
    });

    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newRefreshToken = await this.generateRefreshToken(token.userId, false);
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date(), replacedByToken: newRefreshToken.token },
    });

    const { user } = token;
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code))),
    ];

    return {
      accessToken: this.generateAccessToken(user.id, user.email, roles, permissions),
      refreshToken: newRefreshToken.token,
      user: { id: user.id, fullName: user.fullName, email: user.email, roles, permissions, profilePicturePath: user.profilePicturePath },
    };
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto, frontendUrl: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetTokenExpiry: expiry },
    });

    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(dto.email)}`;
    console.log(`[Password Reset] ${user.fullName} → ${resetUrl}`);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        passwordResetToken: dto.token,
        passwordResetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, passwordResetToken: null, passwordResetTokenExpiry: null },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

    return { message: 'Password changed successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code))),
    ];

    return { id: user.id, fullName: user.fullName, email: user.email, roles, permissions, profilePicturePath: user.profilePicturePath, isActive: user.isActive, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt };
  }

  private generateAccessToken(userId: string, email: string, roles: string[], permissions: string[]) {
    return this.jwt.sign({ sub: userId, email, roles, permissions });
  }

  private async generateRefreshToken(userId: string, rememberMe = false) {
    const days = rememberMe ? 30 : parseInt(this.config.get('JWT_REFRESH_DAYS', '7'));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.refreshToken.create({
      data: { userId, token: uuidv4(), expiresAt },
    });
  }

  private async handleFailedLogin(userId: string, failCount: number) {
    const newCount = failCount + 1;
    const lockoutEnd = newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: { accessFailedCount: newCount, ...(lockoutEnd && { lockoutEnd }) },
    });
  }
}
