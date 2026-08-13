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
} from '@nestjs/swagger';
import { MachineryService } from './machinery.service';
import {
  CreateMachineryDto,
  UpdateMachineryDto,
  AddMachineryMaintenanceDto,
  MachineryQueryDto,
} from './dto/machinery.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Machinery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('machinery')
export class MachineryController {
  constructor(private readonly machineryService: MachineryService) {}

  // NOTE: GET /maintenance-due MUST be before GET /:id to avoid route conflict
  @Get('maintenance-due')
  @HasPermission('Machinery.View')
  @ApiOperation({ summary: 'Get machinery due for maintenance within 7 days' })
  @ApiResponse({ status: 200, description: 'Returns machineries due for maintenance' })
  getDueForMaintenance() {
    return this.machineryService.getDueForMaintenance();
  }

  @Get('next-code')
  @HasPermission('Machinery.View')
  @ApiOperation({ summary: 'Get the next auto-generated machinery code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.machineryService.getNextCode().then((code) => ({ code }));
  }

  @Get()
  @HasPermission('Machinery.View')
  @ApiOperation({ summary: 'Get all machinery with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of machinery' })
  findAll(@Query() query: MachineryQueryDto) {
    return this.machineryService.findAll(query);
  }

  @Get(':id')
  @HasPermission('Machinery.View')
  @ApiOperation({ summary: 'Get machinery by ID with maintenance records' })
  @ApiParam({ name: 'id', description: 'Machinery UUID' })
  @ApiResponse({ status: 200, description: 'Returns machinery details' })
  @ApiResponse({ status: 404, description: 'Machinery not found' })
  findById(@Param('id') id: string) {
    return this.machineryService.findById(id);
  }

  @Post()
  @HasPermission('Machinery.Create')
  @ApiOperation({ summary: 'Create a new machinery record' })
  @ApiResponse({ status: 201, description: 'Machinery created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateMachineryDto) {
    return this.machineryService.create(dto);
  }

  @Put(':id')
  @HasPermission('Machinery.Edit')
  @ApiOperation({ summary: 'Update machinery details' })
  @ApiParam({ name: 'id', description: 'Machinery UUID' })
  @ApiResponse({ status: 200, description: 'Machinery updated successfully' })
  @ApiResponse({ status: 404, description: 'Machinery not found' })
  update(@Param('id') id: string, @Body() dto: UpdateMachineryDto) {
    return this.machineryService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Machinery.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete machinery record' })
  @ApiParam({ name: 'id', description: 'Machinery UUID' })
  @ApiResponse({ status: 200, description: 'Machinery deleted successfully' })
  @ApiResponse({ status: 404, description: 'Machinery not found' })
  remove(@Param('id') id: string) {
    return this.machineryService.remove(id);
  }

  @Get(':id/maintenance')
  @HasPermission('Machinery.View')
  @ApiOperation({ summary: 'Get maintenance history for a machinery' })
  @ApiParam({ name: 'id', description: 'Machinery UUID' })
  @ApiResponse({ status: 200, description: 'Returns maintenance history ordered by date desc' })
  @ApiResponse({ status: 404, description: 'Machinery not found' })
  getMaintenanceHistory(@Param('id') id: string) {
    return this.machineryService.getMaintenanceHistory(id);
  }

  @Post(':id/maintenance')
  @HasPermission('Machinery.Edit')
  @ApiOperation({ summary: 'Add a maintenance record to a machinery' })
  @ApiParam({ name: 'id', description: 'Machinery UUID' })
  @ApiResponse({ status: 201, description: 'Maintenance record added successfully' })
  @ApiResponse({ status: 404, description: 'Machinery not found' })
  addMaintenance(
    @Param('id') id: string,
    @Body() dto: AddMachineryMaintenanceDto,
  ) {
    return this.machineryService.addMaintenance(id, dto);
  }
}
