import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/dto/pagination.dto';
import { FraudService } from '../fraud/fraud.service';
import { CustomersService } from '../customers/customers.service';
import { CouponsService } from '../offers/coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';
import { randomSuffix } from '../common/utils/slug.util';
import {
  BulkStatusDto,
  CreateOrderDto,
  OrderQueryDto,
  UpdateStatusDto,
} from './dto/order.dto';

const ORDER_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
  payments: true,
  customer: { select: { id: true, name: true, phone: true, isFraud: true, isBlocked: true } },
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fraud: FraudService,
    private readonly customers: CustomersService,
    private readonly coupons: CouponsService,
    private readonly notifications: NotificationsService,
  ) {}

  private async generateOrderNumber(storeSlug: string): Promise<string> {
    return `ORX-${storeSlug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}${randomSuffix(2).toUpperCase()}`;
  }

  async create(storeId: string, dto: CreateOrderDto, employeeId?: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    // Block check
    if (await this.fraud.isBlocked(storeId, dto.shippingPhone)) {
      throw new ForbiddenException('Customer is blocked from ordering');
    }

    if (!dto.items?.length) throw new BadRequestException('Order must contain items');

    // Resolve products and compute totals
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, storeId },
      include: { variants: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      let price = Number(product.salePrice ?? product.regularPrice);
      let variantName: string | undefined;
      let sku = product.sku ?? undefined;
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) throw new BadRequestException(`Variant ${item.variantId} not found`);
        price = Number(variant.price);
        variantName = variant.name;
        sku = variant.sku ?? sku;
      }
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      itemsData.push({
        productId: product.id,
        variantId: item.variantId,
        productName: product.name,
        variantName,
        sku,
        price: new Prisma.Decimal(price),
        quantity: item.quantity,
        total: new Prisma.Decimal(lineTotal),
      });
    }

    // Coupon
    let discount = 0;
    let shippingCharge = dto.shippingCharge ?? 0;
    if (dto.couponCode) {
      const result = await this.coupons.validate(storeId, {
        code: dto.couponCode,
        subtotal,
        phone: dto.shippingPhone,
      });
      if (result.valid) {
        discount = result.discount;
        if (result.freeShipping) shippingCharge = 0;
      } else {
        throw new BadRequestException(`Coupon invalid: ${result.reason}`);
      }
    }

    const total = Math.max(0, subtotal - discount) + shippingCharge;

    // Customer upsert
    const customer = await this.customers.upsert(storeId, {
      name: dto.shippingName,
      phone: dto.shippingPhone,
      email: dto.email,
      address: dto.shippingAddress,
      district: dto.shippingDistrict,
      thana: dto.shippingThana,
    });

    // Duplicate detection: same customer + same products within 30 minutes
    const isDuplicate = await this.detectDuplicate(storeId, customer.id, productIds);

    // Fraud scoring
    const fraudResult = await this.fraud.score(storeId, dto.shippingPhone);

    const orderNumber = await this.generateOrderNumber(store.slug);

    const order = await this.prisma.order.create({
      data: {
        storeId,
        customerId: customer.id,
        employeeId,
        orderNumber,
        paymentMethod: dto.paymentMethod ?? 'COD',
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        shippingCharge: new Prisma.Decimal(shippingCharge),
        total: new Prisma.Decimal(total),
        couponCode: dto.couponCode,
        note: dto.note,
        shippingName: dto.shippingName,
        shippingPhone: dto.shippingPhone,
        shippingAddress: dto.shippingAddress,
        shippingDistrict: dto.shippingDistrict,
        shippingThana: dto.shippingThana,
        isFraud: fraudResult.isFraud,
        isDuplicate,
        items: { createMany: { data: itemsData } },
        statusHistory: { create: { status: 'PENDING', note: 'Order placed' } },
      },
      include: ORDER_INCLUDE,
    });

    if (dto.couponCode) await this.coupons.incrementUsage(storeId, dto.couponCode);

    // Notifications
    await this.notifications.push({
      storeId,
      type: 'NEW_ORDER',
      title: 'New order received',
      body: `Order ${orderNumber} for ${total} ${store.currency}`,
      meta: { orderId: order.id, total },
    });

    if (fraudResult.isFraud) {
      await this.notifications.push({
        storeId,
        type: 'FRAUD_DETECTED',
        title: 'Potential fraud flagged',
        body: `Order ${orderNumber} flagged (score ${fraudResult.score})`,
        meta: { orderId: order.id, score: fraudResult.score },
      });
    }

    return order;
  }

  private async detectDuplicate(storeId: string, customerId: string, productIds: string[]) {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const recent = await this.prisma.order.findMany({
      where: { storeId, customerId, createdAt: { gte: since } },
      include: { items: true },
    });
    const sorted = [...productIds].sort().join(',');
    return recent.some((o) => {
      const ids = o.items.map((i) => i.productId).sort().join(',');
      return ids === sorted;
    });
  }

  async findAll(storeId: string, q: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {
      storeId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.from || q.to
        ? {
            createdAt: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(q.to) } : {}),
            },
          }
        : {}),
      ...(q.search
        ? {
            OR: [
              { orderNumber: { contains: q.search, mode: 'insensitive' } },
              { shippingPhone: { contains: q.search } },
              { shippingName: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true, customer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginated(items, total, q.page, q.limit);
  }

  async findOne(storeId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(storeId: string, orderId: string, dto: UpdateStatusDto, changedBy?: string) {
    const order = await this.findOne(storeId, orderId);
    if (order.status === dto.status) return order;

    await this.applyStockEffects(order.status, dto.status, orderId);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        statusHistory: {
          create: { status: dto.status, note: dto.note, changedBy },
        },
        ...(dto.status === 'DELIVERED' ? { paymentStatus: 'PAID' } : {}),
      },
      include: ORDER_INCLUDE,
    });

    // Update customer aggregates on delivery
    if (dto.status === 'DELIVERED') {
      await this.prisma.customer.update({
        where: { id: order.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: order.total },
        },
      });
    }

    await this.notifications.push({
      storeId,
      type: 'COURIER_STATUS',
      title: 'Order status updated',
      body: `Order ${order.orderNumber} is now ${dto.status}`,
      meta: { orderId, status: dto.status },
    });

    return updated;
  }

  /** Deduct stock when moving into CONFIRMED; restore when CANCELLED/RETURNED. */
  private async applyStockEffects(from: OrderStatus, to: OrderStatus, orderId: string) {
    const deductStates: OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const wasDeducted = deductStates.includes(from);
    const willDeduct = deductStates.includes(to);

    if (!wasDeducted && willDeduct) {
      await this.adjustStock(orderId, -1);
    } else if (wasDeducted && (to === 'CANCELLED' || to === 'RETURNED')) {
      await this.adjustStock(orderId, +1);
    }
  }

  private async adjustStock(orderId: string, direction: 1 | -1) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (item.variantId) {
        await this.prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stockQty: { increment: direction * item.quantity } },
        });
      }
      const product = await this.prisma.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: direction * item.quantity } },
      });
      if (direction === -1 && product.trackInventory && product.stockQty <= product.lowStockAlert) {
        await this.notifications.push({
          storeId: product.storeId,
          type: 'LOW_STOCK',
          title: 'Low stock alert',
          body: `${product.name} is low (${product.stockQty} left)`,
          meta: { productId: product.id, stockQty: product.stockQty },
        });
      }
    }
  }

  async bulkStatus(storeId: string, dto: BulkStatusDto, changedBy?: string) {
    const results: unknown[] = [];
    for (const id of dto.orderIds) {
      results.push(
        await this.updateStatus(storeId, id, { status: dto.status, note: dto.note }, changedBy),
      );
    }
    return { updated: results.length };
  }

  async findByTrackingId(storeId: string, trackingId: string) {
    const order = await this.prisma.order.findFirst({
      where: { storeId, trackingId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found for tracking id');
    return order;
  }
}
