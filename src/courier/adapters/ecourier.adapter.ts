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
export class ECourierAdapter implements CourierAdapter {
  readonly provider = 'ecourier';
  private readonly baseUrl = 'https://staging.ecourier.com.bd/api';

  private headers(config: Record<string, any>) {
    return {
      'Content-Type': 'application/json',
      'API-KEY': config.apiKey || '',
      'API-SECRET': config.apiSecret || '',
      'USER-ID': config.userId || '',
    };
  }

  async bookShipment(order: Order, config: Record<string, any>): Promise<CourierBookingResult> {
    const res = await fetch(`${this.baseUrl}/order-place`, {
      method: 'POST',
      headers: this.headers(config),
      body: JSON.stringify({
        recipient_name: order.shippingName,
        recipient_mobile: order.shippingPhone,
        recipient_city: order.shippingDistrict,
        recipient_thana: order.shippingThana,
        recipient_address: order.shippingAddress,
        package_code: order.orderNumber,
        product_price: Number(order.total),
        payment_method: order.paymentMethod === 'COD' ? 'COD' : 'PREPAID',
        comments: order.note || '',
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'E-Courier booking failed');
    return { trackingId: data?.ID || data?.tracking, status: 'booked', raw: data };
  }

  async trackShipment(trackingId: string, config: Record<string, any>): Promise<TrackingStatus> {
    const res = await fetch(`${this.baseUrl}/track`, {
      method: 'POST',
      headers: this.headers(config),
      body: JSON.stringify({ product_id: trackingId }),
    });
    const data: any = await res.json().catch(() => ({}));
    return { trackingId, status: data?.status || 'unknown', raw: data };
  }

  async cancelShipment(): Promise<void> {}

  async getRates(request: RateRequest): Promise<RateResult> {
    const insideDhaka = /dhaka/i.test(request.district);
    return { provider: this.provider, price: insideDhaka ? 60 : 110, currency: 'BDT', estimatedDays: insideDhaka ? 1 : 3 };
  }
}
