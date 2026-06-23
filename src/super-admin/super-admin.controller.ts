import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const [merchants, stores, products, orders, customers] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.store.count({ where: { isActive: true } }),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.customer.count(),
    ]);

    const revenueResult = await this.prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });

    return {
      totalMerchants: merchants,
      totalStores: stores,
      totalProducts: products,
      totalOrders: orders,
      totalCustomers: customers,
      totalRevenue: revenueResult._sum.total || 0,
    };
  }

  @Get('merchants')
  async merchants() {
    return this.prisma.merchant.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        _count: { select: { stores: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('stores')
  async stores() {
    return this.prisma.store.findMany({
      include: {
        merchant: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('orders')
  async recentOrders() {
    return this.prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });
  }
}
