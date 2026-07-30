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
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto, CreateCustomerTransactionDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customer')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @HasPermission('Customers.View')
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of customers' })
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @HasPermission('Customers.View')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Returns customer details with outstanding balance' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @HasPermission('Customers.Create')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Put(':id')
  @HasPermission('Customers.Edit')
  @ApiOperation({ summary: 'Update customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Customers.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Get(':id/ledger')
  @HasPermission('Customers.View')
  getLedger(@Param('id') id: string, @Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.customersService.getLedger(id, fromDate, toDate);
  }

  @Post(':id/transactions')
  @HasPermission('Customers.Edit')
  addTransaction(@Param('id') id: string, @Body() dto: CreateCustomerTransactionDto) {
    return this.customersService.addTransaction(id, dto);
  }

  @Delete(':id/transactions/:txId')
  @HasPermission('Customers.Edit')
  @HttpCode(HttpStatus.OK)
  deleteTransaction(@Param('id') id: string, @Param('txId') txId: string) {
    return this.customersService.deleteTransaction(id, txId);
  }
}
