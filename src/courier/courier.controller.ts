import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CourierService } from './courier.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import {
  BookShipmentDto,
  BulkBookDto,
  CourierConfigDto,
  RateQueryDto,
  ReturnDto,
} from './dto/courier.dto';

@ApiTags('Courier')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/courier')
export class CourierController {
  constructor(private readonly service: CourierService) {}

  @Post('configs')
  saveConfig(@Param('storeId') storeId: string, @Body() dto: CourierConfigDto) {
    return this.service.saveConfig(storeId, dto);
  }

  @Get('configs')
  listConfigs(@Param('storeId') storeId: string) {
    return this.service.listConfigs(storeId);
  }

  @Post('book')
  book(@Param('storeId') storeId: string, @Body() dto: BookShipmentDto) {
    return this.service.book(storeId, dto.orderId, dto.provider);
  }

  @Post('bulk-book')
  bulkBook(@Param('storeId') storeId: string, @Body() dto: BulkBookDto) {
    return this.service.bulkBook(storeId, dto);
  }

  @Get('track/:trackingId')
  track(@Param('storeId') storeId: string, @Param('trackingId') trackingId: string) {
    return this.service.track(storeId, trackingId);
  }

  @Post('return')
  logReturn(@Param('storeId') storeId: string, @Body() dto: ReturnDto) {
    return this.service.logReturn(storeId, dto);
  }

  @Get('rates')
  rates(@Param('storeId') storeId: string, @Query() q: RateQueryDto) {
    return this.service.getRates(storeId, q);
  }
}
