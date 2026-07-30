import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Malik Construction Supplies' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Malik & Sons Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: '+92-300-9876543' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'malik@supplies.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '456 Industrial Area, Karachi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '9876543-2' })
  @IsOptional()
  @IsString()
  ntn?: string;

  @ApiPropertyOptional({ example: 'Building Materials' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Preferred supplier for cement and steel' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'Malik Construction Supplies' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Malik & Sons Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: '+92-300-9876543' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'malik@supplies.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '456 Industrial Area, Karachi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '9876543-2' })
  @IsOptional()
  @IsString()
  ntn?: string;

  @ApiPropertyOptional({ example: 'Building Materials' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Preferred supplier for cement and steel' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SupplierQueryDto {
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

  @ApiPropertyOptional({ example: 'Malik' })
  @IsOptional()
  @IsString()
  search?: string;

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

export class CreateSupplierTransactionDto {
  supplierId: string;
  type: 'PURCHASE' | 'PAYMENT';
  amount: number;
  date: string; // ISO date string
  description?: string;
  reference?: string;
}
