import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateProjectExpenseDto,
  AssignLabourDto,
  AssignMachineryDto,
} from './dto/project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ── Projects ────────────────────────────────────────────────────────────────

  @Get('next-code')
  @HasPermission('Project.View')
  @ApiOperation({ summary: 'Get the next auto-generated project code' })
  getNextCode() {
    return this.projectsService.getNextCode().then((code) => ({ code }));
  }

  @Get()
  @HasPermission('Project.View')
  @ApiOperation({ summary: 'Get all projects with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.projectsService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      search,
      status,
    );
  }

  @Post()
  @HasPermission('Project.Manage')
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get(':id')
  @HasPermission('Project.View')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @HasPermission('Project.Manage')
  @ApiOperation({ summary: 'Update project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Project.Manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Get(':id/stats')
  @HasPermission('Project.View')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  getStats(@Param('id') id: string) {
    return this.projectsService.getStats(id);
  }

  // ── Milestones ──────────────────────────────────────────────────────────────

  @Post(':id/milestones')
  @HasPermission('Project.Manage')
  @ApiOperation({ summary: 'Add milestone to project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  addMilestone(@Param('id') id: string, @Body() dto: CreateMilestoneDto) {
    return this.projectsService.addMilestone(id, dto);
  }

  @Patch(':id/milestones/:mid')
  @HasPermission('Project.Manage')
  @ApiOperation({ summary: 'Update milestone' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'mid', description: 'Milestone UUID' })
  updateMilestone(
    @Param('id') id: string,
    @Param('mid') mid: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.projectsService.updateMilestone(id, mid, dto);
  }

  @Delete(':id/milestones/:mid')
  @HasPermission('Project.Manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete milestone' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'mid', description: 'Milestone UUID' })
  deleteMilestone(@Param('id') id: string, @Param('mid') mid: string) {
    return this.projectsService.deleteMilestone(id, mid);
  }

  // ── Expenses ────────────────────────────────────────────────────────────────

  @Post(':id/expenses')
  @HasPermission('Project.Manage')
  @ApiOperation({ summary: 'Add expense to project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  addExpense(@Param('id') id: string, @Body() dto: CreateProjectExpenseDto) {
    return this.projectsService.addExpense(id, dto);
  }

  @Delete(':id/expenses/:expId')
  @HasPermission('Project.Manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project expense' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'expId', description: 'Expense UUID' })
  deleteExpense(@Param('id') id: string, @Param('expId') expId: string) {
    return this.projectsService.deleteExpense(id, expId);
  }

  // ── Labours ─────────────────────────────────────────────────────────────────

  @Post(':id/labours')
  @HasPermission('Project.Manage')
  @ApiOperation({ summary: 'Assign labour to project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  assignLabour(@Param('id') id: string, @Body() dto: AssignLabourDto) {
    return this.projectsService.assignLabour(id, dto);
  }

  @Delete(':id/labours/:labourId')
  @HasPermission('Project.Manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove labour from project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'labourId', description: 'Labour UUID' })
  removeLabour(@Param('id') id: string, @Param('labourId') labourId: string) {
    return this.projectsService.removeLabour(id, labourId);
  }

  // ── Machinery ───────────────────────────────────────────────────────────────

  @Post(':id/machinery')
  @HasPermission('Project.Manage')
  @ApiOperation({ summary: 'Assign machinery to project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  assignMachinery(@Param('id') id: string, @Body() dto: AssignMachineryDto) {
    return this.projectsService.assignMachinery(id, dto);
  }

  @Delete(':id/machinery/:machineryId')
  @HasPermission('Project.Manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove machinery from project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'machineryId', description: 'Machinery UUID' })
  removeMachinery(
    @Param('id') id: string,
    @Param('machineryId') machineryId: string,
  ) {
    return this.projectsService.removeMachinery(id, machineryId);
  }
}
