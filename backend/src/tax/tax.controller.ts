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
import { TaxService } from './tax.service';
import { CreateTaxDto, UpdateTaxDto, TaxQueryDto } from './dto/tax.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tax')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('summary')
  @HasPermission('Tax.View')
  @ApiOperation({ summary: 'Get tax summary with totals, paid, unpaid, overdue and by type' })
  @ApiResponse({ status: 200, description: 'Returns tax summary' })
  getSummary() {
    return this.taxService.getSummary();
  }

  @Get('next-code')
  @HasPermission('Tax.View')
  @ApiOperation({ summary: 'Get the next auto-generated tax record code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.taxService.getNextCode().then((code) => ({ code }));
  }

  @Get()
  @HasPermission('Tax.View')
  @ApiOperation({ summary: 'Get all tax records with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of tax records' })
  findAll(@Query() query: TaxQueryDto) {
    return this.taxService.findAll(query);
  }

  @Get(':id')
  @HasPermission('Tax.View')
  @ApiOperation({ summary: 'Get tax record by ID' })
  @ApiParam({ name: 'id', description: 'Tax Record UUID' })
  @ApiResponse({ status: 200, description: 'Returns tax record' })
  @ApiResponse({ status: 404, description: 'Tax record not found' })
  findById(@Param('id') id: string) {
    return this.taxService.findById(id);
  }

  @Post()
  @HasPermission('Tax.Create')
  @ApiOperation({ summary: 'Create a new tax record' })
  @ApiResponse({ status: 201, description: 'Tax record created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateTaxDto, @CurrentUser('id') userId: string) {
    return this.taxService.create(dto, userId);
  }

  @Put(':id')
  @HasPermission('Tax.Edit')
  @ApiOperation({ summary: 'Update tax record' })
  @ApiParam({ name: 'id', description: 'Tax Record UUID' })
  @ApiResponse({ status: 200, description: 'Tax record updated successfully' })
  @ApiResponse({ status: 404, description: 'Tax record not found' })
  update(@Param('id') id: string, @Body() dto: UpdateTaxDto) {
    return this.taxService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Tax.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete tax record' })
  @ApiParam({ name: 'id', description: 'Tax Record UUID' })
  @ApiResponse({ status: 200, description: 'Tax record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tax record not found' })
  remove(@Param('id') id: string) {
    return this.taxService.remove(id);
  }
}
