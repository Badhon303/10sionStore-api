import { Module } from '@nestjs/common';
import { IncompleteOrdersService } from './incomplete-orders.service';
import { IncompleteOrdersController } from './incomplete-orders.controller';

@Module({
  controllers: [IncompleteOrdersController],
  providers: [IncompleteOrdersService],
})
export class IncompleteOrdersModule {}
