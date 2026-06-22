import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { InvoiceService } from './invoice.service';
import { FraudModule } from '../fraud/fraud.module';
import { CustomersModule } from '../customers/customers.module';
import { OffersModule } from '../offers/offers.module';
import { CourierModule } from '../courier/courier.module';

@Module({
  imports: [FraudModule, CustomersModule, OffersModule, CourierModule],
  controllers: [OrdersController],
  providers: [OrdersService, InvoiceService],
  exports: [OrdersService],
})
export class OrdersModule {}
