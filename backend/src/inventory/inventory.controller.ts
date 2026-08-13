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
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  AddStockTransactionDto,
  InventoryQueryDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @HasPermission('Inventory.View')
  @ApiOperation({ summary: 'Get all inventory items with pagination, search, and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of inventory items' })
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('next-code')
  @HasPermission('Inventory.View')
  @ApiOperation({ summary: 'Get the next auto-generated inventory item code' })
  @ApiResponse({ status: 200, description: 'Returns next code' })
  getNextCode() {
    return this.inventoryService.getNextCode().then((code) => ({ code }));
  }

  @Get(':id')
  @HasPermission('Inventory.View')
  @ApiOperation({ summary: 'Get inventory item by ID with stock transactions' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({ status: 200, description: 'Returns inventory item details' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  findById(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  @Post()
  @HasPermission('Inventory.Create')
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Put(':id')
  @HasPermission('Inventory.Edit')
  @ApiOperation({ summary: 'Update inventory item details' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @HasPermission('Inventory.Delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Get(':id/transactions')
  @HasPermission('Inventory.View')
  @ApiOperation({ summary: 'Get stock transaction history for an inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({ status: 200, description: 'Returns stock transactions ordered by date desc' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  getTransactions(@Param('id') id: string) {
    return this.inventoryService.getTransactions(id);
  }

  @Post(':id/transactions')
  @HasPermission('Inventory.Edit')
  @ApiOperation({ summary: 'Add a stock transaction (In / Out / Adjustment) for an inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiResponse({ status: 201, description: 'Transaction recorded and stock updated' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or validation error' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  addTransaction(
    @Param('id') id: string,
    @Body() dto: AddStockTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.addTransaction(id, dto, userId);
  }
}
