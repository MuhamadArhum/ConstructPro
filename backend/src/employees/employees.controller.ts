import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  UpdateSalaryDto,
  MarkSalaryAsPaidDto,
  EmployeeQueryDto,
  CreateEmployeeAdvanceDto,
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

  @Get('next-code')
  @HasPermission('Employees.View')
  @ApiOperation({ summary: 'Get the next auto-generated employee code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.employeesService.getNextCode().then((code) => ({ code }));
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

  @Patch(':id/activate')
  @HasPermission('Employees.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-activate a deactivated employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee activated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  activate(@Param('id') id: string) {
    return this.employeesService.activate(id);
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
  @ApiOperation({ summary: 'Generate salary for an employee (status: Generated)' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  processSalary(@Param('id') id: string, @Body() dto: ProcessSalaryDto) {
    return this.employeesService.processSalary(id, dto);
  }

  @Patch(':id/salary/:salaryId/pay')
  @HasPermission('Employees.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a generated salary as paid' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiParam({ name: 'salaryId', description: 'SalaryPayment UUID' })
  markSalaryAsPaid(
    @Param('id') id: string,
    @Param('salaryId') salaryId: string,
    @Body() dto: MarkSalaryAsPaidDto,
  ) {
    return this.employeesService.markSalaryAsPaid(id, salaryId, dto);
  }

  @Put(':id/salary/:salaryId')
  @HasPermission('Employees.Edit')
  @ApiOperation({ summary: 'Edit a salary record' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiParam({ name: 'salaryId', description: 'SalaryPayment UUID' })
  updateSalary(
    @Param('id') id: string,
    @Param('salaryId') salaryId: string,
    @Body() dto: UpdateSalaryDto,
  ) {
    return this.employeesService.updateSalary(id, salaryId, dto);
  }

  @Delete(':id/salary/:salaryId')
  @HasPermission('Employees.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a salary record' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiParam({ name: 'salaryId', description: 'SalaryPayment UUID' })
  deleteSalary(@Param('id') id: string, @Param('salaryId') salaryId: string) {
    return this.employeesService.deleteSalary(id, salaryId);
  }

  // ── Advances ────────────────────────────────────────────────────────────────

  @Get(':id/advances')
  @HasPermission('Employees.View')
  @ApiOperation({ summary: 'Get all advances for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  getAdvances(@Param('id') id: string) {
    return this.employeesService.getAdvances(id);
  }

  @Get(':id/advances/pending')
  @HasPermission('Employees.View')
  @ApiOperation({ summary: 'Get pending (not yet deducted) advances total' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  getPendingAdvancesTotal(@Param('id') id: string) {
    return this.employeesService.getPendingAdvancesTotal(id);
  }

  @Post(':id/advances')
  @HasPermission('Employees.Edit')
  @ApiOperation({ summary: 'Add an advance for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  addAdvance(@Param('id') id: string, @Body() dto: CreateEmployeeAdvanceDto) {
    return this.employeesService.addAdvance(id, dto);
  }

  @Delete(':id/advances/:advanceId')
  @HasPermission('Employees.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a pending advance' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiParam({ name: 'advanceId', description: 'Advance UUID' })
  deleteAdvance(@Param('id') id: string, @Param('advanceId') advanceId: string) {
    return this.employeesService.deleteAdvance(id, advanceId);
  }
}
