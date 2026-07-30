import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { MachineryStatus, MaintenanceType } from '@prisma/client';

export class CreateMachineryDto {
  @ApiProperty({ example: 'Excavator XL-200' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'XL-200' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'SN-12345' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: '2022-03-15' })
  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ enum: MachineryStatus })
  @IsOptional()
  @IsEnum(MachineryStatus)
  status?: MachineryStatus;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalRunningHours?: number = 0;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsString()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ example: 'Heavy-duty excavator for foundation work' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMachineryDto {
  @ApiPropertyOptional({ example: 'Excavator XL-200' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'XL-200' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'SN-12345' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: '2022-03-15' })
  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ enum: MachineryStatus })
  @IsOptional()
  @IsEnum(MachineryStatus)
  status?: MachineryStatus;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalRunningHours?: number;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsString()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddMachineryMaintenanceDto {
  @ApiProperty({ example: '2024-05-01' })
  @IsString()
  @IsNotEmpty()
  maintenanceDate: string;

  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiPropertyOptional({ example: 'Oil change and filter replacement' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 5000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number = 0;

  @ApiPropertyOptional({ example: 120.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  runningHoursAtService?: number;

  @ApiPropertyOptional({ example: '2024-11-01' })
  @IsOptional()
  @IsString()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ example: 'QuickFix Machinery Services' })
  @IsOptional()
  @IsString()
  serviceProvider?: string;
}

export class MachineryQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageNumber?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ example: 'Excavator' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MachineryStatus })
  @IsOptional()
  @IsEnum(MachineryStatus)
  status?: MachineryStatus;
}
