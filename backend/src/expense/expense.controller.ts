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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseQueryDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Expense')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get('summary')
  @HasPermission('Expense.View')
  @ApiOperation({ summary: 'Get expense summary with totals and category breakdown' })
  @ApiResponse({ status: 200, description: 'Returns expense summary' })
  getSummary() {
    return this.expenseService.getSummary();
  }

  @Get('next-code')
  @HasPermission('Expense.View')
  @ApiOperation({ summary: 'Get the next auto-generated expense code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.expenseService.getNextCode().then((code) => ({ code }));
  }

  @Get()
  @HasPermission('Expense.View')
  @ApiOperation({ summary: 'Get all expense records with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of expense records' })
  findAll(@Query() query: ExpenseQueryDto, @CurrentUser('id') userId: string) {
    return this.expenseService.findAll(query, userId);
  }

  @Get(':id')
  @HasPermission('Expense.View')
  @ApiOperation({ summary: 'Get expense record by ID' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Returns expense record' })
  @ApiResponse({ status: 404, description: 'Expense record not found' })
  findById(@Param('id') id: string) {
    return this.expenseService.findById(id);
  }

  @Post()
  @HasPermission('Expense.Create')
  @ApiOperation({ summary: 'Create a new expense record' })
  @ApiResponse({ status: 201, description: 'Expense record created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateExpenseDto, @CurrentUser('id') userId: string) {
    return this.expenseService.create(dto, userId);
  }

  @Put(':id')
  @HasPermission('Expense.Edit')
  @ApiOperation({ summary: 'Update expense record' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Expense record updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense record not found' })
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Expense.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete expense record' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Expense record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense record not found' })
  remove(@Param('id') id: string) {
    return this.expenseService.remove(id);
  }
}
