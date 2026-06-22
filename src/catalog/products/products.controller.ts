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
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import {
  BulkImportDto,
  CreateProductDto,
  ImageInput,
  ProductQueryDto,
  StockUpdateDto,
  UpdateProductDto,
  VariantInput,
} from './dto/product.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateProductDto) {
    return this.service.create(storeId, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string, @Query() q: ProductQueryDto) {
    return this.service.findAll(storeId, q);
  }

  @Get('low-stock')
  lowStock(@Param('storeId') storeId: string) {
    return this.service.lowStock(storeId);
  }

  @Post('bulk-import')
  bulkImport(@Param('storeId') storeId: string, @Body() dto: BulkImportDto) {
    return this.service.bulkImport(storeId, dto);
  }

  @Get(':productId')
  findOne(@Param('storeId') storeId: string, @Param('productId') productId: string) {
    return this.service.findOne(storeId, productId);
  }

  @Patch(':productId')
  update(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(storeId, productId, dto);
  }

  @Delete(':productId')
  archive(@Param('storeId') storeId: string, @Param('productId') productId: string) {
    return this.service.archive(storeId, productId);
  }

  @Patch(':productId/stock')
  updateStock(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() dto: StockUpdateDto,
  ) {
    return this.service.updateStock(storeId, productId, dto);
  }

  // ─── Variants ───
  @Post(':productId/variants')
  addVariant(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() dto: VariantInput,
  ) {
    return this.service.addVariant(storeId, productId, dto);
  }

  @Patch(':productId/variants/:variantId')
  updateVariant(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: Partial<VariantInput>,
  ) {
    return this.service.updateVariant(storeId, productId, variantId, dto);
  }

  @Delete(':productId/variants/:variantId')
  deleteVariant(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.service.deleteVariant(storeId, productId, variantId);
  }

  // ─── Images ───
  @Post(':productId/images')
  addImages(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: { images: ImageInput[] },
  ) {
    return this.service.addImages(storeId, productId, body.images || []);
  }

  @Delete(':productId/images/:imageId')
  deleteImage(
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.service.deleteImage(storeId, productId, imageId);
  }
}
