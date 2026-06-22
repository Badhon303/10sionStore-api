import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify, randomSuffix } from '../../common/utils/slug.util';
import { paginated } from '../../common/dto/pagination.dto';
import {
  BulkImportDto,
  CreateProductDto,
  ProductQueryDto,
  StockUpdateDto,
  UpdateProductDto,
  VariantInput,
} from './dto/product.dto';

const INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: true,
  tags: true,
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueSlug(storeId: string, base: string) {
    let slug = slugify(base) || 'product';
    let candidate = slug;
    while (await this.prisma.product.findFirst({ where: { storeId, slug: candidate } })) {
      candidate = `${slug}-${randomSuffix(4)}`;
    }
    return candidate;
  }

  async create(storeId: string, dto: CreateProductDto) {
    const slug = await this.uniqueSlug(storeId, dto.slug || dto.name);
    return this.prisma.product.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        sku: dto.sku,
        description: dto.description,
        shortDescription: dto.shortDescription,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        type: dto.type,
        status: dto.status,
        regularPrice: new Prisma.Decimal(dto.regularPrice),
        salePrice: dto.salePrice != null ? new Prisma.Decimal(dto.salePrice) : null,
        costPrice: dto.costPrice != null ? new Prisma.Decimal(dto.costPrice) : null,
        weight: dto.weight,
        stockQty: dto.stockQty ?? 0,
        lowStockAlert: dto.lowStockAlert ?? 5,
        trackInventory: dto.trackInventory ?? true,
        isFeatured: dto.isFeatured ?? false,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        tags: dto.tags ? { create: dto.tags.map((tag) => ({ tag })) } : undefined,
        images: dto.images
          ? {
              create: dto.images.map((img, i) => ({
                url: img.url,
                altText: img.altText,
                sortOrder: img.sortOrder ?? i,
                isPrimary: img.isPrimary ?? i === 0,
              })),
            }
          : undefined,
        variants: dto.variants
          ? {
              create: dto.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                price: new Prisma.Decimal(v.price),
                stockQty: v.stockQty ?? 0,
                imageUrl: v.imageUrl,
                attributes: v.attributes,
              })),
            }
          : undefined,
      },
      include: INCLUDE,
    });
  }

  async findAll(storeId: string, q: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      storeId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.brandId ? { brandId: q.brandId } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { sku: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginated(items, total, q.page, q.limit);
  }

  async findOne(storeId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
      include: INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(storeId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(storeId, id);
    const data: Prisma.ProductUpdateInput = {
      name: dto.name,
      sku: dto.sku,
      description: dto.description,
      shortDescription: dto.shortDescription,
      type: dto.type,
      status: dto.status,
      weight: dto.weight,
      stockQty: dto.stockQty,
      lowStockAlert: dto.lowStockAlert,
      trackInventory: dto.trackInventory,
      isFeatured: dto.isFeatured,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
    };
    if (dto.slug) data.slug = await this.uniqueSlug(storeId, dto.slug);
    if (dto.regularPrice != null) data.regularPrice = new Prisma.Decimal(dto.regularPrice);
    if (dto.salePrice != null) data.salePrice = new Prisma.Decimal(dto.salePrice);
    if (dto.costPrice != null) data.costPrice = new Prisma.Decimal(dto.costPrice);
    if (dto.categoryId !== undefined)
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
    if (dto.brandId !== undefined)
      data.brand = dto.brandId ? { connect: { id: dto.brandId } } : { disconnect: true };

    return this.prisma.product.update({ where: { id }, data, include: INCLUDE });
  }

  async archive(storeId: string, id: string) {
    await this.findOne(storeId, id);
    await this.prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } });
    return { message: 'Product archived' };
  }

  async updateStock(storeId: string, id: string, dto: StockUpdateDto) {
    await this.findOne(storeId, id);
    if (dto.variantId) {
      return this.prisma.productVariant.update({
        where: { id: dto.variantId },
        data: { stockQty: dto.stockQty },
      });
    }
    return this.prisma.product.update({ where: { id }, data: { stockQty: dto.stockQty } });
  }

  async lowStock(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId, trackInventory: true, status: { not: 'ARCHIVED' } },
      include: { variants: true },
    });
    return products.filter(
      (p) =>
        p.stockQty <= p.lowStockAlert ||
        p.variants.some((v) => v.stockQty <= p.lowStockAlert),
    );
  }

  async bulkImport(storeId: string, dto: BulkImportDto) {
    const results: { id: string; name: string }[] = [];
    for (const p of dto.products) {
      results.push(await this.create(storeId, p));
    }
    return { imported: results.length, products: results.map((r) => ({ id: r.id, name: r.name })) };
  }

  // ─── Variants ───
  async addVariant(storeId: string, productId: string, dto: VariantInput) {
    await this.findOne(storeId, productId);
    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        sku: dto.sku,
        price: new Prisma.Decimal(dto.price),
        stockQty: dto.stockQty ?? 0,
        imageUrl: dto.imageUrl,
        attributes: dto.attributes,
      },
    });
  }

  async updateVariant(storeId: string, productId: string, variantId: string, dto: Partial<VariantInput>) {
    await this.findOne(storeId, productId);
    const data: any = { ...dto };
    if (dto.price != null) data.price = new Prisma.Decimal(dto.price);
    return this.prisma.productVariant.update({ where: { id: variantId }, data });
  }

  async deleteVariant(storeId: string, productId: string, variantId: string) {
    await this.findOne(storeId, productId);
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { message: 'Variant deleted' };
  }

  // ─── Images ───
  async addImages(storeId: string, productId: string, images: { url: string; altText?: string; isPrimary?: boolean }[]) {
    await this.findOne(storeId, productId);
    const created = await this.prisma.$transaction(
      images.map((img, i) =>
        this.prisma.productImage.create({
          data: { productId, url: img.url, altText: img.altText, sortOrder: i, isPrimary: img.isPrimary ?? false },
        }),
      ),
    );
    return created;
  }

  async deleteImage(storeId: string, productId: string, imageId: string) {
    await this.findOne(storeId, productId);
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted' };
  }
}
