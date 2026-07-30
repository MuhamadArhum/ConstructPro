import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.companySettings.findFirst();

    if (!settings) {
      settings = await this.prisma.companySettings.create({
        data: {
          companyName: 'ConstructPro',
          currency: 'PKR',
        },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const existing = await this.prisma.companySettings.findFirst();

    const data: any = {};

    if (dto.companyName !== undefined) data.companyName = dto.companyName;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.ntn !== undefined) data.ntn = dto.ntn;
    if (dto.strn !== undefined) data.strn = dto.strn;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.financialYearStart !== undefined) {
      data.financialYearStart = dto.financialYearStart ? new Date(dto.financialYearStart) : null;
    }

    if (existing) {
      return this.prisma.companySettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      return this.prisma.companySettings.create({
        data: {
          companyName: dto.companyName ?? 'ConstructPro',
          currency: dto.currency ?? 'PKR',
          ...data,
        },
      });
    }
  }
}
