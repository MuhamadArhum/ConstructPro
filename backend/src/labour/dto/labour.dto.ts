import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateLabourDto {
  @ApiPropertyOptional({ example: 'LAB-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Rashid Masih' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '+92-300-2222222' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '35202-1111111-1' })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({ example: '12 Labour Colony, Lahore' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Mason' })
  @IsOptional()
  @IsString()
  trade?: string;

  @ApiProperty({ example: 1200 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dailyWage: number;

  @ApiPropertyOptional({ example: 150, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeRatePerHour?: number = 0;

  @ApiProperty({ example: '2024-03-01' })
  @IsDateString()
  joinDate: string;
}

export class UpdateLabourDto {
  @ApiPropertyOptional({ example: 'LAB-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Rashid Masih' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+92-300-2222222' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '35202-1111111-1' })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({ example: '12 Labour Colony, Lahore' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Mason' })
  @IsOptional()
  @IsString()
  trade?: string;

  @ApiPropertyOptional({ example: 1400 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dailyWage?: number;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeRatePerHour?: number;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertAttendanceDto {
  @ApiProperty({ example: 'labour-uuid-here' })
  @IsString()
  @IsNotEmpty()
  labourId: string;

  @ApiProperty({ example: '2024-07-15', description: 'ISO date string (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isPresent: boolean;

  @ApiPropertyOptional({ example: 2.5, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeHours?: number = 0;

  @ApiPropertyOptional({ example: 'Arrived late' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkUpsertAttendanceDto {
  @ApiProperty({ type: [UpsertAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertAttendanceDto)
  records: UpsertAttendanceDto[];
}

export class AddAdvanceDto {
  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2024-07-10' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Emergency medical expense' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LabourQueryDto {
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

  @ApiPropertyOptional({ example: 'Rashid' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Mason' })
  @IsOptional()
  @IsString()
  trade?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
