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
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { Public } from '../common/decorators/public.decorator';
import { InitiatePaymentDto, PaymentConfigDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('stores/:storeId/payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Post('configs')
  saveConfig(@Param('storeId') storeId: string, @Body() dto: PaymentConfigDto) {
    return this.service.saveConfig(storeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get('configs')
  listConfigs(@Param('storeId') storeId: string) {
    return this.service.listConfigs(storeId);
  }

  // ─── bKash ───
  @Public()
  @Post('bkash/initiate')
  initiateBkash(@Param('storeId') storeId: string, @Body() dto: InitiatePaymentDto) {
    return this.service.initiateBkash(storeId, dto);
  }

  @Public()
  @Get('bkash/callback')
  bkashCallback(@Param('storeId') storeId: string, @Query() query: any) {
    return this.service.handleBkashCallback(storeId, query);
  }

  // ─── Nagad ───
  @Public()
  @Post('nagad/initiate')
  initiateNagad(@Param('storeId') storeId: string, @Body() dto: InitiatePaymentDto) {
    return this.service.initiateNagad(storeId, dto);
  }

  @Public()
  @Get('nagad/callback')
  nagadCallback(@Param('storeId') storeId: string, @Query() query: any) {
    return this.service.handleNagadCallback(storeId, query);
  }

  // ─── SSLCommerz ───
  @Public()
  @Post('sslcommerz/init')
  initiateSslcommerz(@Param('storeId') storeId: string, @Body() dto: InitiatePaymentDto) {
    return this.service.initiateSslcommerz(storeId, dto);
  }

  @Public()
  @Post('sslcommerz/ipn')
  sslcommerzIpn(@Param('storeId') storeId: string, @Body() body: any) {
    return this.service.handleSslcommerzIpn(storeId, body);
  }
}
