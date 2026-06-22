import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IncompleteOrdersService, SaveIncompleteDto } from './incomplete-orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Incomplete Orders')
@Controller('stores/:storeId/incomplete-orders')
export class IncompleteOrdersController {
  constructor(private readonly service: IncompleteOrdersService) {}

  // Called from storefront on checkout step change
  @Public()
  @Post()
  save(@Param('storeId') storeId: string, @Body() dto: SaveIncompleteDto) {
    return this.service.save(storeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get()
  list(@Param('storeId') storeId: string, @Query('isFollowedUp') isFollowedUp?: string) {
    const flag = isFollowedUp === undefined ? undefined : isFollowedUp === 'true';
    return this.service.list(storeId, flag);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Patch(':id/follow-up')
  followUp(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.markFollowedUp(storeId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Delete(':id')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.remove(storeId, id);
  }
}
