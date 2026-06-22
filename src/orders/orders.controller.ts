import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { CourierService } from '../courier/courier.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  BulkStatusDto,
  CreateOrderDto,
  OrderQueryDto,
  UpdateStatusDto,
} from './dto/order.dto';
import { BookShipmentDto, BulkBookDto } from '../courier/dto/courier.dto';

@ApiTags('Orders')
@Controller('stores/:storeId/orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly invoices: InvoiceService,
    private readonly courier: CourierService,
  ) {}

  // Public storefront checkout endpoint
  @Public()
  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateOrderDto) {
    return this.orders.create(storeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get()
  findAll(@Param('storeId') storeId: string, @Query() q: OrderQueryDto) {
    return this.orders.findAll(storeId, q);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Post('bulk-status')
  bulkStatus(
    @Param('storeId') storeId: string,
    @Body() dto: BulkStatusDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orders.bulkStatus(storeId, dto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Post('bulk-courier')
  bulkCourier(@Param('storeId') storeId: string, @Body() dto: BulkBookDto) {
    return this.courier.bulkBook(storeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get('scan/:trackingId')
  scan(@Param('storeId') storeId: string, @Param('trackingId') trackingId: string) {
    return this.orders.findByTrackingId(storeId, trackingId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get(':orderId')
  findOne(@Param('storeId') storeId: string, @Param('orderId') orderId: string) {
    return this.orders.findOne(storeId, orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Patch(':orderId/status')
  updateStatus(
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orders.updateStatus(storeId, orderId, dto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Post(':orderId/courier-book')
  courierBook(
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
    @Body() dto: BookShipmentDto,
  ) {
    return this.courier.book(storeId, orderId, dto.provider);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get(':orderId/invoice')
  async invoice(
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.invoices.generate(storeId, orderId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
