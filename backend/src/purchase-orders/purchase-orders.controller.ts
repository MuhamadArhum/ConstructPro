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
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePOStatusDto,
} from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/permissions.decorator';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @HasPermission('PurchaseOrder.View')
  @ApiOperation({ summary: 'Get all purchase orders with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.purchaseOrdersService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      status,
      supplierId,
      projectId,
    );
  }

  @Post()
  @HasPermission('PurchaseOrder.Manage')
  @ApiOperation({ summary: 'Create a new purchase order' })
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(dto);
  }

  @Get(':id')
  @HasPermission('PurchaseOrder.View')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiParam({ name: 'id', description: 'Purchase Order UUID' })
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id')
  @HasPermission('PurchaseOrder.Manage')
  @ApiOperation({ summary: 'Update purchase order' })
  @ApiParam({ name: 'id', description: 'Purchase Order UUID' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Patch(':id/status')
  @HasPermission('PurchaseOrder.Manage')
  @ApiOperation({ summary: 'Update purchase order status' })
  @ApiParam({ name: 'id', description: 'Purchase Order UUID' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePOStatusDto) {
    return this.purchaseOrdersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HasPermission('PurchaseOrder.Manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete purchase order' })
  @ApiParam({ name: 'id', description: 'Purchase Order UUID' })
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }
}
