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
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getIncomeExpenseReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getIncomeExpenseReport(startDate, endDate);
  }

  @Get('labour')
  @HasPermission('Reports.View')
  @ApiOperation({ summary: 'Get labour report with attendance and wage summary' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getLabourReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getLabourReport(startDate, endDate);
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
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getTaxReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getTaxReport(startDate, endDate);
  }
}
