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
import { LabourService } from './labour.service';
import {
  CreateLabourDto,
  UpdateLabourDto,
  UpsertAttendanceDto,
  BulkUpsertAttendanceDto,
  AddAdvanceDto,
  LabourQueryDto,
} from './dto/labour.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Labour')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('labour')
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

  @Get()
  @HasPermission('Labour.View')
  @ApiOperation({ summary: 'Get all labour workers with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of labour workers' })
  findAll(@Query() query: LabourQueryDto) {
    return this.labourService.findAll(query);
  }

  @Get('next-code')
  @HasPermission('Labour.View')
  @ApiOperation({ summary: 'Get the next auto-generated labour code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.labourService.getNextCode().then((code) => ({ code }));
  }

  // NOTE: POST /attendance* routes MUST be before /:id routes
  @Post('attendance')
  @HasPermission('Labour.Edit')
  @ApiOperation({ summary: 'Create or update attendance record for a labour worker' })
  @ApiResponse({ status: 201, description: 'Attendance upserted successfully' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  upsertAttendance(@Body() dto: UpsertAttendanceDto) {
    return this.labourService.upsertAttendance(dto);
  }

  @Post('attendance/bulk')
  @HasPermission('Labour.Edit')
  @ApiOperation({ summary: 'Bulk create or update attendance records (save whole month at once)' })
  @ApiResponse({ status: 201, description: 'Attendance records saved' })
  bulkUpsertAttendance(@Body() dto: BulkUpsertAttendanceDto) {
    return this.labourService.bulkUpsertAttendance(dto);
  }

  @Get(':id')
  @HasPermission('Labour.View')
  @ApiOperation({ summary: 'Get labour worker by ID' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiResponse({ status: 200, description: 'Returns labour worker details' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  findById(@Param('id') id: string) {
    return this.labourService.findById(id);
  }

  @Post()
  @HasPermission('Labour.Create')
  @ApiOperation({ summary: 'Create a new labour worker' })
  @ApiResponse({ status: 201, description: 'Labour worker created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateLabourDto) {
    return this.labourService.create(dto);
  }

  @Put(':id')
  @HasPermission('Labour.Edit')
  @ApiOperation({ summary: 'Update labour worker details' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiResponse({ status: 200, description: 'Labour worker updated successfully' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  update(@Param('id') id: string, @Body() dto: UpdateLabourDto) {
    return this.labourService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Labour.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate labour worker (soft delete)' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiResponse({ status: 200, description: 'Labour worker deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  deactivate(@Param('id') id: string) {
    return this.labourService.deactivate(id);
  }

  @Patch(':id/activate')
  @HasPermission('Labour.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-activate a deactivated labour worker' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiResponse({ status: 200, description: 'Labour worker activated successfully' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  activate(@Param('id') id: string) {
    return this.labourService.activate(id);
  }

  @Get(':id/attendance')
  @HasPermission('Labour.View')
  @ApiOperation({ summary: 'Get attendance records for a labour worker for a given month/year' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 7 })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2024 })
  @ApiResponse({ status: 200, description: 'Returns attendance records' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  getAttendance(
    @Param('id') id: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.labourService.getAttendance(id, Number(month), Number(year));
  }

  @Get(':id/advances/pending')
  @HasPermission('Labour.View')
  @ApiOperation({ summary: 'Get pending (non-deducted) advances for a labour worker' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiResponse({ status: 200, description: 'Returns pending advances and total' })
  getPendingAdvances(@Param('id') id: string) {
    return this.labourService.getPendingAdvances(id);
  }

  @Get(':id/advances')
  @HasPermission('Labour.View')
  @ApiOperation({ summary: 'Get all advance payments for a labour worker' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiResponse({ status: 200, description: 'Returns all advance payments ordered by date desc' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  getAdvances(@Param('id') id: string) {
    return this.labourService.getAdvances(id);
  }

  @Post(':id/advances')
  @HasPermission('Labour.Edit')
  @ApiOperation({ summary: 'Add an advance payment for a labour worker' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiResponse({ status: 201, description: 'Advance payment recorded successfully' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  addAdvance(@Param('id') id: string, @Body() dto: AddAdvanceDto) {
    return this.labourService.addAdvance(id, dto);
  }

  @Delete(':id/advances/:advanceId')
  @HasPermission('Labour.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a pending advance for a labour worker' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiParam({ name: 'advanceId', description: 'Advance UUID' })
  @ApiResponse({ status: 200, description: 'Advance deleted' })
  deleteAdvance(@Param('id') id: string, @Param('advanceId') advanceId: string) {
    return this.labourService.deleteAdvance(id, advanceId);
  }

  @Get(':id/ledger')
  @HasPermission('Labour.View')
  @ApiOperation({ summary: 'Get monthly ledger for a labour worker (wages, overtime, advances, net payable)' })
  @ApiParam({ name: 'id', description: 'Labour UUID' })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 7 })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2024 })
  @ApiResponse({ status: 200, description: 'Returns complete ledger summary for the month' })
  @ApiResponse({ status: 404, description: 'Labour not found' })
  getLedger(
    @Param('id') id: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.labourService.getLedger(id, Number(month), Number(year));
  }
}
