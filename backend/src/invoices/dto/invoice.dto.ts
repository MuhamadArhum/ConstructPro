import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export enum InvoiceStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Cancelled = 'Cancelled',
}

export class CreateInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  @IsNotEmpty()
  status: InvoiceStatus;
}
