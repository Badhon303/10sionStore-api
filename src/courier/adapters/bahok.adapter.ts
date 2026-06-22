import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';
import {
  CourierAdapter,
  CourierBookingResult,
  RateRequest,
  RateResult,
  TrackingStatus,
} from '../courier.interface';

@Injectable()
export class BahokAdapter implements CourierAdapter {
  readonly provider = 'bahok';
  private readonly baseUrl = 'https://api.bahok.com.bd/v1';

  private headers(config: Record<string, any>) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey || ''}`,
    };
  }

  async bookShipment(order: Order, config: Record<string, any>): Promise<CourierBookingResult> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.headers(config),
      body: JSON.stringify({
        invoice: order.orderNumber,
        name: order.shippingName,
        phone: order.shippingPhone,
        address: `${order.shippingAddress}, ${order.shippingThana}, ${order.shippingDistrict}`,
        cod: Number(order.total),
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Bahok booking failed');
    return { trackingId: data?.tracking_id, status: 'booked', raw: data };
  }

  async trackShipment(trackingId: string, config: Record<string, any>): Promise<TrackingStatus> {
    const res = await fetch(`${this.baseUrl}/track/${trackingId}`, { headers: this.headers(config) });
    const data: any = await res.json().catch(() => ({}));
    return { trackingId, status: data?.status || 'unknown', raw: data };
  }

  async cancelShipment(): Promise<void> {}

  async getRates(request: RateRequest): Promise<RateResult> {
    const insideDhaka = /dhaka/i.test(request.district);
    return { provider: this.provider, price: insideDhaka ? 55 : 115, currency: 'BDT', estimatedDays: insideDhaka ? 1 : 4 };
  }
}
