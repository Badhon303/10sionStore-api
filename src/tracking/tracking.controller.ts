import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { Public } from '../common/decorators/public.decorator';
import { FacebookEventDto, GoogleEventDto, TrackingConfigDto } from './dto/tracking.dto';

@ApiTags('Tracking')
@Controller('stores/:storeId/tracking')
export class TrackingController {
  constructor(private readonly service: TrackingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Post('configs')
  saveConfig(@Param('storeId') storeId: string, @Body() dto: TrackingConfigDto) {
    return this.service.saveConfig(storeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get('configs')
  listConfigs(@Param('storeId') storeId: string) {
    return this.service.listConfigs(storeId);
  }

  // Public so storefront can fire server-side events
  @Public()
  @Post('facebook/event')
  facebookEvent(@Param('storeId') storeId: string, @Body() dto: FacebookEventDto) {
    return this.service.sendFacebookEvent(storeId, dto);
  }

  @Public()
  @Post('google/event')
  googleEvent(@Param('storeId') storeId: string, @Body() dto: GoogleEventDto) {
    return this.service.sendGoogleEvent(storeId, dto);
  }
}
