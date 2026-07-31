import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('income-expense')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get income vs expense report grouped by month' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getIncomeExpenseReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getIncomeExpenseReport(fromDate, toDate);
  }

  @Get('labour')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get labour report with attendance and wage summary' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getLabourReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getLabourReport(fromDate, toDate);
  }

  @Get('inventory')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get inventory report with stock levels and values' })
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('tax')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get tax report with paid/unpaid/overdue breakdown' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getTaxReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getTaxReport(fromDate, toDate);
  }

  @Get('customers')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get customer report with billing and outstanding balances' })
  getCustomerReport() {
    return this.reportsService.getCustomerReport();
  }

  @Get('suppliers')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get supplier report with purchases and outstanding balances' })
  getSupplierReport() {
    return this.reportsService.getSupplierReport();
  }

  @Get('employees')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get employee report with salary payment summary' })
  getEmployeeReport() {
    return this.reportsService.getEmployeeReport();
  }

  @Get('machinery')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get machinery report with maintenance cost summary' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getMachineryReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getMachineryReport(fromDate, toDate);
  }

  @Get('vehicles')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get vehicle report with maintenance cost summary' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getVehicleReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getVehicleReport(fromDate, toDate);
  }
}
