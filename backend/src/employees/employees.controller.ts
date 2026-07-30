import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ProcessSalaryDto,
  EmployeeQueryDto,
} from './dto/employee.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @HasPermission('Employees.View')
  @ApiOperation({ summary: 'Get all employees with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of employees' })
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(query);
  }

  // NOTE: GET /salaries MUST be before GET /:id to avoid route conflict
  @Get('salaries')
  @HasPermission('Employees.View')
  @ApiOperation({ summary: 'Get all salary payments for a given month and year' })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 7 })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2024 })
  @ApiResponse({ status: 200, description: 'Returns salary payments with employee info' })
  getAllSalaries(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.employeesService.getAllSalaries(Number(month), Number(year));
  }

  @Get(':id')
  @HasPermission('Employees.View')
  @ApiOperation({ summary: 'Get employee by ID with recent salary history' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Returns employee details' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  @HasPermission('Employees.Create')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Put(':id')
  @HasPermission('Employees.Edit')
  @ApiOperation({ summary: 'Update employee details' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Employees.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate employee (soft delete)' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  deactivate(@Param('id') id: string) {
    return this.employeesService.deactivate(id);
  }

  @Get(':id/salary-history')
  @HasPermission('Employees.View')
  @ApiOperation({ summary: 'Get full salary payment history for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Returns all salary payments ordered by date desc' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getSalaryHistory(@Param('id') id: string) {
    return this.employeesService.getSalaryHistory(id);
  }

  @Post(':id/salary')
  @HasPermission('Employees.Edit')
  @ApiOperation({ summary: 'Process salary payment for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 201, description: 'Salary payment recorded successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  processSalary(@Param('id') id: string, @Body() dto: ProcessSalaryDto) {
    return this.employeesService.processSalary(id, dto);
  }
}
