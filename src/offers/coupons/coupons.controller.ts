import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

@ApiTags('Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/coupons')
export class CouponsController {
  constructor(private readonly service: CouponsService) {}

  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateCouponDto) {
    return this.service.create(storeId, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Param('storeId') storeId: string, @Body() dto: ValidateCouponDto) {
    return this.service.validate(storeId, dto);
  }

  @Patch(':id')
  update(@Param('storeId') storeId: string, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.service.update(storeId, id, dto);
  }

  @Delete(':id')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.remove(storeId, id);
  }
}
