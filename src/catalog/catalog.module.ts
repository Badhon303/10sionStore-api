import { Module } from '@nestjs/common';
import { CategoriesService } from './categories/categories.service';
import { CategoriesController } from './categories/categories.controller';
import { BrandsService } from './brands/brands.service';
import { BrandsController } from './brands/brands.controller';
import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';

@Module({
  controllers: [CategoriesController, BrandsController, ProductsController],
  providers: [CategoriesService, BrandsService, ProductsService],
  exports: [ProductsService],
})
export class CatalogModule {}
