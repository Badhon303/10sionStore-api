import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChangePasswordDto, UpdateMerchantDto } from './dto/merchant.dto';

@ApiTags('Merchants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly service: MerchantsService) {}

  @Get('me')
  me(@CurrentUser('sub') id: string) {
    return this.service.profile(id);
  }

  @Patch('me')
  update(@CurrentUser('sub') id: string, @Body() dto: UpdateMerchantDto) {
    return this.service.update(id, dto);
  }

  @Post('me/change-password')
  changePassword(@CurrentUser('sub') id: string, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(id, dto);
  }
}
