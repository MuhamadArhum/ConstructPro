import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiPropertyOptional({ example: 'EMP-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Muhammad Ali' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: 'Site Engineer' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '+92-300-1111111' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '35202-7654321-1' })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({ example: '789 Model Town, Lahore' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 50000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  joinDate: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'EMP-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Muhammad Ali' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Site Engineer' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '+92-300-1111111' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '35202-7654321-1' })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({ example: '789 Model Town, Lahore' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 55000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProcessSalaryDto {
  @ApiProperty({ example: 7, description: 'Month (1-12)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2024 })
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  year: number;

  @ApiProperty({ example: 50000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @ApiPropertyOptional({ example: 5000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bonus?: number = 0;

  @ApiPropertyOptional({ example: 2000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deductions?: number = 0;

  @ApiPropertyOptional({ example: 26 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  daysPresent?: number;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalDays?: number = 30;

  @ApiPropertyOptional({ example: 'On-time payment' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateSalaryDto {
  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deductions?: number;

  @ApiPropertyOptional({ example: 26 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  daysPresent?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalDays?: number;

  @ApiPropertyOptional({ example: 'Corrected entry' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkSalaryAsPaidDto {
  @ApiProperty({ example: '2026-08-25' })
  @IsDateString()
  paidDate: string;
}

export class CreateEmployeeAdvanceDto {
  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Medical emergency' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpsertEmployeeAttendanceDto {
  @ApiProperty({ example: 'uuid-of-employee' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2024-08-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isPresent: boolean;

  @ApiPropertyOptional({ example: 2, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @ApiPropertyOptional({ example: 'Present on site' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkUpsertEmployeeAttendanceDto {
  @ApiProperty({ type: [UpsertEmployeeAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertEmployeeAttendanceDto)
  records: UpsertEmployeeAttendanceDto[];
}

export class EmployeeQueryDto {
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

  @ApiPropertyOptional({ example: 'Muhammad' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;

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
