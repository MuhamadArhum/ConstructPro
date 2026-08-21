import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('expense')
  @HasPermission('Expense.View')
  @ApiOperation({ summary: 'Get all expense categories' })
  getExpenseCategories() {
    return this.categoriesService.getByType('expense');
  }

  @Get('income')
  @HasPermission('Income.View')
  @ApiOperation({ summary: 'Get all income categories' })
  getIncomeCategories() {
    return this.categoriesService.getByType('income');
  }

  @Post('expense')
  @HasPermission('Expense.Manage')
  @ApiOperation({ summary: 'Create expense category' })
  createExpenseCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create('expense', dto.name);
  }

  @Post('income')
  @HasPermission('Income.Manage')
  @ApiOperation({ summary: 'Create income category' })
  createIncomeCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create('income', dto.name);
  }

  @Delete(':id')
  @HasPermission('Expense.Manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user-defined category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
