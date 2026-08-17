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
import { PlantsService } from './plants.service';
import {
  CreatePlantDto,
  UpdatePlantDto,
  PlantQueryDto,
  AddPlantMaintenanceDto,
} from './dto/plant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Plants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plant')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Get()
  @HasPermission('Plants.View')
  @ApiOperation({ summary: 'Get all plants with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of plants' })
  findAll(@Query() query: PlantQueryDto) {
    return this.plantsService.findAll(query);
  }

  @Get('next-code')
  @HasPermission('Plants.View')
  @ApiOperation({ summary: 'Get the next auto-generated plant code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.plantsService.getNextCode().then((code) => ({ code }));
  }

  @Get(':id')
  @HasPermission('Plants.View')
  @ApiOperation({ summary: 'Get plant by ID' })
  @ApiParam({ name: 'id', description: 'Plant UUID' })
  @ApiResponse({ status: 200, description: 'Returns plant details' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  findById(@Param('id') id: string) {
    return this.plantsService.findById(id);
  }

  @Post()
  @HasPermission('Plants.Create')
  @ApiOperation({ summary: 'Create a new plant record' })
  @ApiResponse({ status: 201, description: 'Plant created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreatePlantDto) {
    return this.plantsService.create(dto);
  }

  @Put(':id')
  @HasPermission('Plants.Edit')
  @ApiOperation({ summary: 'Update plant details' })
  @ApiParam({ name: 'id', description: 'Plant UUID' })
  @ApiResponse({ status: 200, description: 'Plant updated successfully' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePlantDto) {
    return this.plantsService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Plants.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete plant record' })
  @ApiParam({ name: 'id', description: 'Plant UUID' })
  @ApiResponse({ status: 200, description: 'Plant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  remove(@Param('id') id: string) {
    return this.plantsService.remove(id);
  }

  @Get(':id/maintenance')
  @HasPermission('Plants.View')
  @ApiOperation({ summary: 'Get maintenance history for a plant' })
  @ApiParam({ name: 'id', description: 'Plant UUID' })
  getMaintenanceHistory(@Param('id') id: string) {
    return this.plantsService.getMaintenanceHistory(id);
  }

  @Post(':id/maintenance')
  @HasPermission('Plants.Edit')
  @ApiOperation({ summary: 'Add a maintenance record to a plant' })
  @ApiParam({ name: 'id', description: 'Plant UUID' })
  addMaintenance(@Param('id') id: string, @Body() dto: AddPlantMaintenanceDto) {
    return this.plantsService.addMaintenance(id, dto);
  }

  @Delete(':id/maintenance/:recordId')
  @HasPermission('Plants.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a maintenance record from a plant' })
  deleteMaintenance(@Param('id') id: string, @Param('recordId') recordId: string) {
    return this.plantsService.deleteMaintenance(id, recordId);
  }
}
