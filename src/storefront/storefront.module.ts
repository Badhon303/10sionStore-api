import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { PublicController } from './public.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [StorefrontController, PublicController],
})
export class StorefrontModule {}
