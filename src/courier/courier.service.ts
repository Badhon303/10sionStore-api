import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { encryptJson, decryptJson } from '../common/utils/crypto.util';
import { CourierAdapter } from './courier.interface';
import { PathaoAdapter } from './adapters/pathao.adapter';
import { SteadfastAdapter } from './adapters/steadfast.adapter';
import { RedxAdapter } from './adapters/redx.adapter';
import { ECourierAdapter } from './adapters/ecourier.adapter';
import { BahokAdapter } from './adapters/bahok.adapter';
import { BulkBookDto, CourierConfigDto, RateQueryDto, ReturnDto } from './dto/courier.dto';

@Injectable()
export class CourierService {
  private readonly adapters: Record<string, CourierAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    pathao: PathaoAdapter,
    steadfast: SteadfastAdapter,
    redx: RedxAdapter,
    ecourier: ECourierAdapter,
    bahok: BahokAdapter,
  ) {
    this.adapters = {
      pathao,
      steadfast,
      redx,
      ecourier,
      bahok,
    };
  }

  private getAdapter(provider: string): CourierAdapter {
    const adapter = this.adapters[provider?.toLowerCase()];
    if (!adapter) throw new BadRequestException(`Unsupported courier provider: ${provider}`);
    return adapter;
  }

  async saveConfig(storeId: string, dto: CourierConfigDto) {
    return this.prisma.courierConfig.upsert({
      where: { storeId_provider: { storeId, provider: dto.provider } },
      update: { config: { enc: encryptJson(dto.config) }, isActive: dto.isActive ?? true },
      create: {
        storeId,
        provider: dto.provider,
        config: { enc: encryptJson(dto.config) },
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listConfigs(storeId: string) {
    const configs = await this.prisma.courierConfig.findMany({ where: { storeId } });
    return configs.map((c) => ({ id: c.id, provider: c.provider, isActive: c.isActive }));
  }

  private async resolveConfig(storeId: string, provider: string): Promise<Record<string, any>> {
    const row = await this.prisma.courierConfig.findUnique({
      where: { storeId_provider: { storeId, provider } },
    });
    if (!row || !row.isActive) {
      throw new BadRequestException(`Courier ${provider} is not configured/active`);
    }
    const stored = row.config as any;
    return stored?.enc ? decryptJson(stored.enc) : stored;
  }

  async book(storeId: string, orderId: string, provider: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, storeId } });
    if (!order) throw new NotFoundException('Order not found');
    const config = await this.resolveConfig(storeId, provider);
    const adapter = this.getAdapter(provider);
    const result = await adapter.bookShipment(order, config);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        courierName: provider,
        trackingId: result.trackingId,
        courierStatus: result.status,
        status: order.status === 'PENDING' || order.status === 'CONFIRMED' ? 'SHIPPED' : order.status,
        statusHistory: { create: { status: 'SHIPPED', note: `Booked with ${provider}` } },
      },
    });

    await this.notifications.push({
      storeId,
      type: 'COURIER_STATUS',
      title: 'Shipment booked',
      body: `Order ${order.orderNumber} booked with ${provider} (${result.trackingId})`,
      meta: { orderId, trackingId: result.trackingId },
    });

    return { trackingId: result.trackingId, status: result.status, order: updated };
  }

  async bulkBook(storeId: string, dto: BulkBookDto) {
    const results: { orderId: string; trackingId?: string; error?: string }[] = [];
    for (const orderId of dto.orderIds) {
      try {
        const r = await this.book(storeId, orderId, dto.provider);
        results.push({ orderId, trackingId: r.trackingId });
      } catch (err) {
        results.push({ orderId, error: (err as Error).message });
      }
    }
    return results;
  }

  async track(storeId: string, trackingId: string) {
    const order = await this.prisma.order.findFirst({ where: { storeId, trackingId } });
    if (!order || !order.courierName) throw new NotFoundException('Shipment not found');
    const config = await this.resolveConfig(storeId, order.courierName);
    const adapter = this.getAdapter(order.courierName);
    const status = await adapter.trackShipment(trackingId, config);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { courierStatus: status.status },
    });
    return status;
  }

  async logReturn(storeId: string, dto: ReturnDto) {
    const order = await this.prisma.order.findFirst({ where: { id: dto.orderId, storeId } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        status: 'RETURNED',
        statusHistory: { create: { status: 'RETURNED', note: dto.reason || 'Returned' } },
      },
    });
  }

  async getRates(storeId: string, q: RateQueryDto) {
    const configs = await this.prisma.courierConfig.findMany({
      where: { storeId, isActive: true },
    });
    const providers = configs.length ? configs.map((c) => c.provider) : Object.keys(this.adapters);
    const rates = await Promise.all(
      providers.map((p) =>
        this.getAdapter(p).getRates({ district: q.district, thana: q.thana }, {}),
      ),
    );
    return rates.sort((a, b) => a.price - b.price);
  }
}
