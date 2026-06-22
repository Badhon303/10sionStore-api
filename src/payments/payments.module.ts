import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { BkashGateway } from './gateways/bkash.gateway';
import { NagadGateway } from './gateways/nagad.gateway';
import { SslcommerzGateway } from './gateways/sslcommerz.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, BkashGateway, NagadGateway, SslcommerzGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
