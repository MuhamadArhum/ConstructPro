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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto, CreateSupplierTransactionDto } from './dto/supplier.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supplier')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @HasPermission('Suppliers.View')
  @ApiOperation({ summary: 'Get all suppliers with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of suppliers' })
  findAll(@Query() query: SupplierQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get('next-code')
  @HasPermission('Suppliers.View')
  @ApiOperation({ summary: 'Get the next auto-generated supplier code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.suppliersService.getNextCode().then((code) => ({ code }));
  }

  @Get(':id')
  @HasPermission('Suppliers.View')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Returns supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @HasPermission('Suppliers.Create')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Put(':id')
  @HasPermission('Suppliers.Edit')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Suppliers.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }

  @Get(':id/ledger')
  @HasPermission('Suppliers.View')
  getLedger(@Param('id') id: string, @Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.suppliersService.getLedger(id, fromDate, toDate);
  }

  @Post(':id/transactions')
  @HasPermission('Suppliers.Edit')
  addTransaction(@Param('id') id: string, @Body() dto: CreateSupplierTransactionDto) {
    return this.suppliersService.addTransaction(id, dto);
  }

  @Delete(':id/transactions/:txId')
  @HasPermission('Suppliers.Edit')
  @HttpCode(HttpStatus.OK)
  deleteTransaction(@Param('id') id: string, @Param('txId') txId: string) {
    return this.suppliersService.deleteTransaction(id, txId);
  }
}
