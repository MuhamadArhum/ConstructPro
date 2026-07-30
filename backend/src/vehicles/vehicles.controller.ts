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
import { VehiclesService } from './vehicles.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateVehicleMaintenanceDto,
  VehicleQueryDto,
} from './dto/vehicle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vehicle')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @HasPermission('Vehicles.View')
  @ApiOperation({ summary: 'Get all vehicles with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of vehicles' })
  findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get(':id')
  @HasPermission('Vehicles.View')
  @ApiOperation({ summary: 'Get vehicle by ID with maintenance records' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Returns vehicle details' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  findById(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @Post()
  @HasPermission('Vehicles.Create')
  @ApiOperation({ summary: 'Create a new vehicle record' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Put(':id')
  @HasPermission('Vehicles.Edit')
  @ApiOperation({ summary: 'Update vehicle details' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Vehicles.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vehicle record' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  @Get(':id/maintenance')
  @HasPermission('Vehicles.View')
  @ApiOperation({ summary: 'Get maintenance history for a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Returns maintenance history ordered by date desc' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  getMaintenanceHistory(@Param('id') id: string) {
    return this.vehiclesService.getMaintenanceHistory(id);
  }

  @Post(':id/maintenance')
  @HasPermission('Vehicles.Edit')
  @ApiOperation({ summary: 'Add a maintenance record to a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 201, description: 'Maintenance record added successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  addMaintenance(
    @Param('id') id: string,
    @Body() dto: CreateVehicleMaintenanceDto,
  ) {
    return this.vehiclesService.addMaintenance(id, dto);
  }
}
