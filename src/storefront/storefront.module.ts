import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [StorefrontController],
})
export class StorefrontModule {}
