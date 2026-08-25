import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BoqService } from './boq.service';
import {
  CreateBoqDto, UpdateBoqDto,
  CreateBoqSectionDto, UpdateBoqSectionDto,
  CreateBoqItemDto, UpdateBoqItemDto,
  CreateProgressBillDto,
} from './dto/boq.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('BOQ')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boq')
export class BoqController {
  constructor(private readonly boqService: BoqService) {}

  // ── BOQ ─────────────────────────────────────────────────────────────────────

  @Get('project/:projectId')
  @HasPermission('Projects.View')
  @ApiOperation({ summary: 'Get BOQ for a project' })
  @ApiParam({ name: 'projectId' })
  getByProject(@Param('projectId') projectId: string) {
    return this.boqService.getByProject(projectId);
  }

  @Post('project/:projectId')
  @HasPermission('Projects.Edit')
  @ApiOperation({ summary: 'Create BOQ for a project' })
  @ApiParam({ name: 'projectId' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateBoqDto) {
    return this.boqService.create(projectId, dto);
  }

  @Put('project/:projectId')
  @HasPermission('Projects.Edit')
  @ApiOperation({ summary: 'Update BOQ title/notes' })
  @ApiParam({ name: 'projectId' })
  update(@Param('projectId') projectId: string, @Body() dto: UpdateBoqDto) {
    return this.boqService.update(projectId, dto);
  }

  @Delete('project/:projectId')
  @HasPermission('Projects.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete BOQ for a project' })
  @ApiParam({ name: 'projectId' })
  delete(@Param('projectId') projectId: string) {
    return this.boqService.delete(projectId);
  }

  // ── Sections ─────────────────────────────────────────────────────────────────

  @Post('project/:projectId/sections')
  @HasPermission('Projects.Edit')
  @ApiOperation({ summary: 'Add a section to the BOQ' })
  @ApiParam({ name: 'projectId' })
  addSection(@Param('projectId') projectId: string, @Body() dto: CreateBoqSectionDto) {
    return this.boqService.addSection(projectId, dto);
  }

  @Put('sections/:sectionId')
  @HasPermission('Projects.Edit')
  @ApiOperation({ summary: 'Update a BOQ section' })
  @ApiParam({ name: 'sectionId' })
  updateSection(@Param('sectionId') sectionId: string, @Body() dto: UpdateBoqSectionDto) {
    return this.boqService.updateSection(sectionId, dto);
  }

  @Delete('sections/:sectionId')
  @HasPermission('Projects.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a BOQ section and all its items' })
  @ApiParam({ name: 'sectionId' })
  deleteSection(@Param('sectionId') sectionId: string) {
    return this.boqService.deleteSection(sectionId);
  }

  // ── Items ────────────────────────────────────────────────────────────────────

  @Post('sections/:sectionId/items')
  @HasPermission('Projects.Edit')
  @ApiOperation({ summary: 'Add an item to a BOQ section' })
  @ApiParam({ name: 'sectionId' })
  addItem(@Param('sectionId') sectionId: string, @Body() dto: CreateBoqItemDto) {
    return this.boqService.addItem(sectionId, dto);
  }

  @Put('items/:itemId')
  @HasPermission('Projects.Edit')
  @ApiOperation({ summary: 'Update a BOQ item' })
  @ApiParam({ name: 'itemId' })
  updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateBoqItemDto) {
    return this.boqService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @HasPermission('Projects.Edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a BOQ item' })
  @ApiParam({ name: 'itemId' })
  deleteItem(@Param('itemId') itemId: string) {
    return this.boqService.deleteItem(itemId);
  }

  // ── Progress Bills ───────────────────────────────────────────────────────────

  @Post('project/:projectId/progress-bill')
  @HasPermission('Projects.Edit')
  @ApiOperation({ summary: 'Create a progress bill (RA Bill) from BOQ items' })
  @ApiParam({ name: 'projectId' })
  createProgressBill(@Param('projectId') projectId: string, @Body() dto: CreateProgressBillDto) {
    return this.boqService.createProgressBill(projectId, dto);
  }

  @Get('project/:projectId/progress-bills')
  @HasPermission('Projects.View')
  @ApiOperation({ summary: 'Get all progress bills for a BOQ' })
  @ApiParam({ name: 'projectId' })
  getProgressBills(@Param('projectId') projectId: string) {
    return this.boqService.getProgressBills(projectId);
  }
}
