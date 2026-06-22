import { Module } from '@nestjs/common';
import { CourierService } from './courier.service';
import { CourierController } from './courier.controller';
import { PathaoAdapter } from './adapters/pathao.adapter';
import { SteadfastAdapter } from './adapters/steadfast.adapter';
import { RedxAdapter } from './adapters/redx.adapter';
import { ECourierAdapter } from './adapters/ecourier.adapter';
import { BahokAdapter } from './adapters/bahok.adapter';

@Module({
  controllers: [CourierController],
  providers: [
    CourierService,
    PathaoAdapter,
    SteadfastAdapter,
    RedxAdapter,
    ECourierAdapter,
    BahokAdapter,
  ],
  exports: [CourierService],
})
export class CourierModule {}
