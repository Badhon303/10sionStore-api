import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateCampaignDto) {
    return this.service.create(storeId, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Get('active')
  active(@Param('storeId') storeId: string) {
    return this.service.active(storeId);
  }

  @Patch(':id')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.service.update(storeId, id, dto);
  }

  @Delete(':id')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.remove(storeId, id);
  }
}
