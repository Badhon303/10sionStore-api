import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/order.dto';

@ApiTags('Storefront')
@Public()
@Controller('storefront/:storeSlug')
export class StorefrontController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  @Get('info')
  async info(@Param('storeSlug') slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        currency: true,
        domain: true,
        settings: true,
      },
    });
    if (!store) return { error: 'Store not found' };
    return store;
  }

  @Get('categories')
  async categories(@Param('storeSlug') slug: string) {
    const store = await this.prisma.store.findUnique({ where: { slug } });
    if (!store) return [];
    return this.prisma.category.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  @Get('products')
  async products(
    @Param('storeSlug') slug: string,
    @Query('category') categoryId?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '24',
  ) {
    const store = await this.prisma.store.findUnique({ where: { slug } });
    if (!store) return { items: [], meta: { total: 0 } };

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {
      storeId: store.id,
      status: 'ACTIVE',
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  @Get('products/:productId')
  async productDetail(
    @Param('storeSlug') slug: string,
    @Param('productId') productId: string,
  ) {
    const store = await this.prisma.store.findUnique({ where: { slug } });
    if (!store) return { error: 'Store not found' };

    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: store.id, status: 'ACTIVE' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    if (!product) return { error: 'Product not found' };
    return product;
  }

  @Post('checkout')
  async checkout(
    @Param('storeSlug') slug: string,
    @Body() dto: CreateOrderDto,
  ) {
    const store = await this.prisma.store.findUnique({ where: { slug } });
    if (!store) return { error: 'Store not found' };
    return this.orders.create(store.id, dto);
  }
}
