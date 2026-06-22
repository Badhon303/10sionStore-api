import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { FraudService } from './fraud.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';

class CheckFraudDto {
  @IsString()
  phone: string;
}

@ApiTags('Fraud')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/fraud')
export class FraudController {
  constructor(private readonly service: FraudService) {}

  @Post('check')
  check(@Param('storeId') storeId: string, @Body() dto: CheckFraudDto) {
    return this.service.score(storeId, dto.phone);
  }

  @Get('flagged')
  flagged(@Param('storeId') storeId: string) {
    return this.service.flagged(storeId);
  }

  @Post('block/:customerId')
  block(@Param('storeId') storeId: string, @Param('customerId') customerId: string) {
    return this.service.setBlocked(storeId, customerId, true);
  }

  @Post('unblock/:customerId')
  unblock(@Param('storeId') storeId: string, @Param('customerId') customerId: string) {
    return this.service.setBlocked(storeId, customerId, false);
  }
}
