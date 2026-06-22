import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductStatus, ProductType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class VariantInput {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  stockQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ type: Object, example: { color: 'Red', size: 'XL' } })
  @IsObject()
  attributes: Record<string, any>;
}

export class ImageInput {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  regularPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  stockQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  lowStockAlert?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ type: [ImageInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageInput)
  images?: ImageInput[];

  @ApiPropertyOptional({ type: [VariantInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantInput)
  variants?: VariantInput[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class StockUpdateDto {
  @ApiProperty()
  @IsInt()
  stockQty: number;

  @ApiPropertyOptional({ description: 'Variant id; omit to update base product' })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;
}

export class BulkImportDto {
  @ApiProperty({ type: [CreateProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];
}
