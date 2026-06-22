import { Module } from '@nestjs/common';
import { CouponsService } from './coupons/coupons.service';
import { CouponsController } from './coupons/coupons.controller';
import { CampaignsService } from './campaigns/campaigns.service';
import { CampaignsController } from './campaigns/campaigns.controller';

@Module({
  controllers: [CouponsController, CampaignsController],
  providers: [CouponsService, CampaignsService],
  exports: [CouponsService, CampaignsService],
})
export class OffersModule {}
