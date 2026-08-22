import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] as const;

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  siteAddress?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  managerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class CreateProjectExpenseDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectExpenseDto extends PartialType(CreateProjectExpenseDto) {}

export class CreateProjectIncomeDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateProjectIncomeDto extends PartialType(CreateProjectIncomeDto) {}

export class AssignLabourDto {
  @IsString()
  @IsNotEmpty()
  labourId: string;
}

export class AssignMachineryDto {
  @IsString()
  @IsNotEmpty()
  machineryId: string;
}

export class AssignVehicleDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;
}

export class AssignPlantDto {
  @IsString()
  @IsNotEmpty()
  plantId: string;
}

export class AssignEmployeeDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;
}
