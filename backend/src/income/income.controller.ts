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
import { IncomeService } from './income.service';
import { CreateIncomeDto, UpdateIncomeDto, IncomeQueryDto } from './dto/income.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Income')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get('summary')
  @HasPermission('Income.View')
  @ApiOperation({ summary: 'Get income summary with totals and category breakdown' })
  @ApiResponse({ status: 200, description: 'Returns income summary' })
  getSummary() {
    return this.incomeService.getSummary();
  }

  @Get()
  @HasPermission('Income.View')
  @ApiOperation({ summary: 'Get all income records with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of income records' })
  findAll(@Query() query: IncomeQueryDto, @CurrentUser('id') userId: string) {
    return this.incomeService.findAll(query, userId);
  }

  @Get(':id')
  @HasPermission('Income.View')
  @ApiOperation({ summary: 'Get income record by ID' })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiResponse({ status: 200, description: 'Returns income record' })
  @ApiResponse({ status: 404, description: 'Income record not found' })
  findById(@Param('id') id: string) {
    return this.incomeService.findById(id);
  }

  @Post()
  @HasPermission('Income.Create')
  @ApiOperation({ summary: 'Create a new income record' })
  @ApiResponse({ status: 201, description: 'Income record created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateIncomeDto, @CurrentUser('id') userId: string) {
    return this.incomeService.create(dto, userId);
  }

  @Put(':id')
  @HasPermission('Income.Edit')
  @ApiOperation({ summary: 'Update income record' })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiResponse({ status: 200, description: 'Income record updated successfully' })
  @ApiResponse({ status: 404, description: 'Income record not found' })
  update(@Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    return this.incomeService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Income.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete income record' })
  @ApiParam({ name: 'id', description: 'Income UUID' })
  @ApiResponse({ status: 200, description: 'Income record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Income record not found' })
  remove(@Param('id') id: string) {
    return this.incomeService.remove(id);
  }
}
