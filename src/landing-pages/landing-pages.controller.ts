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
import { LandingPagesService } from './landing-pages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { Public } from '../common/decorators/public.decorator';
import { CreateLandingPageDto, UpdateLandingPageDto } from './dto/landing-page.dto';

@ApiTags('Landing Pages')
@Controller('stores/:storeId/landing-pages')
export class LandingPagesController {
  constructor(private readonly service: LandingPagesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateLandingPageDto) {
    return this.service.create(storeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get()
  findAll(@Param('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  // Public for storefront rendering
  @Public()
  @Get(':slug')
  findBySlug(@Param('storeId') storeId: string, @Param('slug') slug: string) {
    return this.service.findBySlug(storeId, slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Patch(':id')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLandingPageDto,
  ) {
    return this.service.update(storeId, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Patch(':id/publish')
  publish(@Param('storeId') storeId: string, @Param('id') id: string, @Body() body: { isPublished: boolean }) {
    return this.service.setPublished(storeId, id, body.isPublished ?? true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Delete(':id')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.remove(storeId, id);
  }
}
