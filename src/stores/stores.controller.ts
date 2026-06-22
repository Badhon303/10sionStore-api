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
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateStoreDto, SetDomainDto, UpdateStoreDto } from './dto/store.dto';

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly service: StoresService) {}

  @Post()
  create(@CurrentUser('sub') merchantId: string, @Body() dto: CreateStoreDto) {
    return this.service.create(merchantId, dto);
  }

  @Get()
  findAll(@CurrentUser('sub') merchantId: string) {
    return this.service.findAll(merchantId);
  }

  @Get(':storeId')
  findOne(@CurrentUser('sub') merchantId: string, @Param('storeId') storeId: string) {
    return this.service.findOne(merchantId, storeId);
  }

  @Patch(':storeId')
  update(
    @CurrentUser('sub') merchantId: string,
    @Param('storeId') storeId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.service.update(merchantId, storeId, dto);
  }

  @Delete(':storeId')
  remove(@CurrentUser('sub') merchantId: string, @Param('storeId') storeId: string) {
    return this.service.softDelete(merchantId, storeId);
  }

  @Post(':storeId/domain')
  setDomain(
    @CurrentUser('sub') merchantId: string,
    @Param('storeId') storeId: string,
    @Body() dto: SetDomainDto,
  ) {
    return this.service.setDomain(merchantId, storeId, dto);
  }
}
