import { Module } from '@nestjs/common';
import { LandingPagesService } from './landing-pages.service';
import { LandingPagesController } from './landing-pages.controller';

@Module({
  controllers: [LandingPagesController],
  providers: [LandingPagesService],
})
export class LandingPagesModule {}
