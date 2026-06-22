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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateCategoryDto) {
    return this.service.create(storeId, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.findOne(storeId, id);
  }

  @Patch(':id')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(storeId, id, dto);
  }

  @Delete(':id')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.remove(storeId, id);
  }
}
