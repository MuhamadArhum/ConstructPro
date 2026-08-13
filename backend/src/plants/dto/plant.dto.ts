import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PlantStatus } from '@prisma/client';

export class CreatePlantDto {
  @ApiPropertyOptional({ example: 'PLT-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Concrete Batching Plant' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Batching Plant' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'SCHWING Stetter' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'SN-CBP-2020' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: '2020-01-15' })
  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 12000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 10000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentValue?: number;

  @ApiPropertyOptional({ enum: PlantStatus })
  @IsOptional()
  @IsEnum(PlantStatus)
  status?: PlantStatus;

  @ApiPropertyOptional({ example: 'Site A - Block 3' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2024-01-10' })
  @IsOptional()
  @IsString()
  lastMaintenanceDate?: string;

  @ApiPropertyOptional({ example: '2024-07-10' })
  @IsOptional()
  @IsString()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ example: 'Requires monthly lubrication' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePlantDto {
  @ApiPropertyOptional({ example: 'PLT-0001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Concrete Batching Plant' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Batching Plant' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'SCHWING Stetter' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'SN-CBP-2020' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: '2020-01-15' })
  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 12000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 9500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentValue?: number;

  @ApiPropertyOptional({ enum: PlantStatus })
  @IsOptional()
  @IsEnum(PlantStatus)
  status?: PlantStatus;

  @ApiPropertyOptional({ example: 'Site B - Block 1' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsString()
  lastMaintenanceDate?: string;

  @ApiPropertyOptional({ example: '2024-09-01' })
  @IsOptional()
  @IsString()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PlantQueryDto {
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

  @ApiPropertyOptional({ example: 'Batching' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PlantStatus })
  @IsOptional()
  @IsEnum(PlantStatus)
  status?: PlantStatus;
}
