import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateTargetDto, TargetsService } from './targets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';

@ApiTags('Targets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/targets')
export class TargetsController {
  constructor(private readonly service: TargetsService) {}

  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateTargetDto) {
    return this.service.create(storeId, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Delete(':id')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.remove(storeId, id);
  }
}
