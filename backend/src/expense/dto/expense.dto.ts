import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiPropertyOptional({ example: 'EXP-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'LabourExpenses' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 'Payment for foundation work' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'Ali Construction Co.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @ApiPropertyOptional({ example: 'Includes overtime charges' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 'EXP-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'LabourExpenses' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Payment for foundation work' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Ali Construction Co.' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 'Includes overtime charges' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ExpenseQueryDto {
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
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ example: 'LabourExpenses' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ example: 'Ali' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMin?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMax?: number;
}
