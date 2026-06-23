import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import * as bcrypt from 'bcrypt';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ───
  @Get('stats')
  async stats() {
    const [merchants, stores, products, orders, customers, templates, pendingRequests] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.store.count({ where: { isActive: true } }),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.customer.count(),
      this.prisma.storeTemplate.count({ where: { isActive: true } }),
      this.prisma.storeRequest.count({ where: { status: 'PENDING' } }),
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
      totalTemplates: templates,
      pendingRequests,
    };
  }

  // ─── Merchants ───
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

  @Patch('merchants/:id/toggle-active')
  async toggleMerchantActive(@Param('id') id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) return { error: 'Merchant not found' };
    return this.prisma.merchant.update({
      where: { id },
      data: { isActive: !merchant.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  // ─── Stores ───
  @Get('stores')
  async stores() {
    return this.prisma.store.findMany({
      include: {
        merchant: { select: { id: true, name: true, email: true } },
        template: { select: { id: true, name: true, slug: true } },
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

  @Patch('stores/:id/permissions')
  async updateStorePermissions(@Param('id') id: string, @Body() body: any) {
    return this.prisma.store.update({
      where: { id },
      data: { permissions: body.permissions },
      select: { id: true, name: true, permissions: true },
    });
  }

  @Get('stores/:id/permissions')
  async getStorePermissions(@Param('id') id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      select: { id: true, name: true, permissions: true },
    });
    if (!store) return { error: 'Store not found' };
    return store;
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

  // ─── Store Templates (CRUD) ───
  @Get('templates')
  async templates() {
    return this.prisma.storeTemplate.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { stores: true, requests: true } },
      },
    });
  }

  @Post('templates')
  async createTemplate(@Body() body: any) {
    return this.prisma.storeTemplate.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        features: body.features || [],
        price: body.price || 0,
        setupFee: body.setupFee || 0,
        monthlyFee: body.monthlyFee || 0,
        thumbnail: body.thumbnail || null,
        screenshots: body.screenshots || null,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder || 0,
      },
    });
  }

  @Patch('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.description !== undefined) data.description = body.description;
    if (body.features !== undefined) data.features = body.features;
    if (body.price !== undefined) data.price = body.price;
    if (body.setupFee !== undefined) data.setupFee = body.setupFee;
    if (body.monthlyFee !== undefined) data.monthlyFee = body.monthlyFee;
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail;
    if (body.screenshots !== undefined) data.screenshots = body.screenshots;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

    return this.prisma.storeTemplate.update({ where: { id }, data });
  }

  // ─── Store Requests ───
  @Get('requests')
  async requests() {
    return this.prisma.storeRequest.findMany({
      include: {
        template: { select: { id: true, name: true, slug: true, thumbnail: true } },
        merchant: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('requests/:id/reject')
  async rejectRequest(@Param('id') id: string) {
    return this.prisma.storeRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  @Post('requests/:id/approve')
  async approveRequest(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const request = await this.prisma.storeRequest.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!request) return { error: 'Request not found' };
    if (request.status !== 'PENDING') return { error: 'Request already processed' };

    // 1. Create merchant account
    const password = body.password || 'Store123!';
    const passwordHash = await bcrypt.hash(password, 12);

    let merchant = await this.prisma.merchant.findUnique({
      where: { email: request.clientEmail },
    });

    if (!merchant) {
      merchant = await this.prisma.merchant.create({
        data: {
          name: request.clientName,
          email: request.clientEmail,
          phone: request.clientPhone,
          passwordHash,
          role: 'MERCHANT',
          isVerified: true,
          isActive: true,
        },
      });
    }

    // 2. Create store from template
    const slug = body.storeSlug || request.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const store = await this.prisma.store.create({
      data: {
        merchantId: merchant.id,
        name: request.businessName,
        slug,
        description: request.template?.description || null,
        currency: 'BDT',
        plan: 'STARTER',
        isActive: true,
        templateId: request.templateId,
      },
    });

    // 3. Update request
    await this.prisma.storeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        merchantId: merchant.id,
        storeId: store.id,
        approvedById: user.sub,
        approvedAt: new Date(),
      },
    });

    return {
      message: 'Store request approved. Merchant account and store created.',
      merchant: { id: merchant.id, name: merchant.name, email: merchant.email, phone: merchant.phone },
      store: { id: store.id, name: store.name, slug: store.slug },
      credentials: { email: request.clientEmail, password },
    };
  }

  // ─── Direct Merchant + Store Creation ───
  @Post('create-merchant')
  async createMerchant(@Body() body: any) {
    // Check if merchant already exists
    const existing = await this.prisma.merchant.findFirst({
      where: { OR: [{ email: body.email }, { phone: body.phone }] },
    });
    if (existing) {
      return { error: 'Merchant with this email or phone already exists' };
    }

    const password = body.password || 'Store123!';
    const passwordHash = await bcrypt.hash(password, 12);

    const merchant = await this.prisma.merchant.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: 'MERCHANT',
        isVerified: true,
        isActive: true,
      },
    });

    // Create store if storeName provided
    let store: any = null;
    if (body.storeName) {
      const slug = body.storeSlug || body.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      store = await this.prisma.store.create({
        data: {
          merchantId: merchant.id,
          name: body.storeName,
          slug,
          description: body.storeDescription || null,
          currency: 'BDT',
          plan: body.plan || 'STARTER',
          isActive: true,
          ...(body.templateId ? { templateId: body.templateId } : {}),
        },
      });
    }

    return {
      message: 'Merchant account created successfully.',
      merchant: { id: merchant.id, name: merchant.name, email: merchant.email, phone: merchant.phone },
      store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
      credentials: { email: body.email, password },
    };
  }
}
