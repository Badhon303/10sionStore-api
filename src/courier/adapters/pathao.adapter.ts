import { Injectable, Logger } from '@nestjs/common';
import { Order } from '@prisma/client';
import {
  CourierAdapter,
  CourierBookingResult,
  RateRequest,
  RateResult,
  TrackingStatus,
} from '../courier.interface';

@Injectable()
export class PathaoAdapter implements CourierAdapter {
  readonly provider = 'pathao';
  private readonly logger = new Logger(PathaoAdapter.name);
  private readonly baseUrl = process.env.PATHAO_BASE_URL || 'https://api-hermes.pathao.com';

  private async getToken(config: Record<string, any>): Promise<string> {
    const res = await fetch(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId || process.env.PATHAO_CLIENT_ID,
        client_secret: config.clientSecret || process.env.PATHAO_CLIENT_SECRET,
        grant_type: 'password',
        username: config.username,
        password: config.password,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!data?.access_token) throw new Error('Pathao auth failed');
    return data.access_token;
  }

  async bookShipment(order: Order, config: Record<string, any>): Promise<CourierBookingResult> {
    const token = await this.getToken(config);
    const res = await fetch(`${this.baseUrl}/aladdin/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        store_id: config.storeId,
        merchant_order_id: order.orderNumber,
        recipient_name: order.shippingName,
        recipient_phone: order.shippingPhone,
        recipient_address: `${order.shippingAddress}, ${order.shippingThana}, ${order.shippingDistrict}`,
        delivery_type: 48,
        item_type: 2,
        item_quantity: 1,
        item_weight: 0.5,
        amount_to_collect: Number(order.total),
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`Pathao booking failed: ${JSON.stringify(data)}`);
      throw new Error(data?.message || 'Pathao booking failed');
    }
    return {
      trackingId: data?.data?.consignment_id,
      status: data?.data?.order_status || 'booked',
      raw: data,
    };
  }

  async trackShipment(trackingId: string, config: Record<string, any>): Promise<TrackingStatus> {
    const token = await this.getToken(config);
    const res = await fetch(`${this.baseUrl}/aladdin/api/v1/orders/${trackingId}/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: any = await res.json().catch(() => ({}));
    return { trackingId, status: data?.data?.order_status || 'unknown', raw: data };
  }

  async cancelShipment(): Promise<void> {
    // Pathao cancellation handled via merchant panel.
  }

  async getRates(request: RateRequest): Promise<RateResult> {
    const insideDhaka = /dhaka/i.test(request.district);
    return {
      provider: this.provider,
      price: insideDhaka ? 70 : 130,
      currency: 'BDT',
      estimatedDays: insideDhaka ? 1 : 3,
    };
  }
}
