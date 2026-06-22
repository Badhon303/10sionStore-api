import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@Param('storeId') storeId: string, @Query('unread') unread?: string) {
    return this.service.list(storeId, unread === 'true');
  }

  @Patch(':id/read')
  markRead(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.markRead(storeId, id);
  }

  @Patch('read-all')
  markAllRead(@Param('storeId') storeId: string) {
    return this.service.markAllRead(storeId);
  }
}
