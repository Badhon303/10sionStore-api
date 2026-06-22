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
export class RedxAdapter implements CourierAdapter {
  readonly provider = 'redx';
  private readonly logger = new Logger(RedxAdapter.name);
  private readonly baseUrl = process.env.REDX_BASE_URL || 'https://openapi.redx.com.bd/v1.0.0-beta';

  private headers(config: Record<string, any>) {
    return {
      'Content-Type': 'application/json',
      'API-ACCESS-TOKEN': `Bearer ${config.apiKey || process.env.REDX_API_KEY || ''}`,
    };
  }

  async bookShipment(order: Order, config: Record<string, any>): Promise<CourierBookingResult> {
    const res = await fetch(`${this.baseUrl}/parcel`, {
      method: 'POST',
      headers: this.headers(config),
      body: JSON.stringify({
        customer_name: order.shippingName,
        customer_phone: order.shippingPhone,
        delivery_area: order.shippingDistrict,
        delivery_area_id: config.areaId,
        customer_address: `${order.shippingAddress}, ${order.shippingThana}`,
        merchant_invoice_id: order.orderNumber,
        cash_collection_amount: Number(order.total),
        parcel_weight: 500,
        value: Number(order.total),
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`RedX booking failed: ${JSON.stringify(data)}`);
      throw new Error(data?.message || 'RedX booking failed');
    }
    return { trackingId: data?.tracking_id, status: 'booked', raw: data };
  }

  async trackShipment(trackingId: string, config: Record<string, any>): Promise<TrackingStatus> {
    const res = await fetch(`${this.baseUrl}/parcel/track/${trackingId}`, {
      headers: this.headers(config),
    });
    const data: any = await res.json().catch(() => ({}));
    return { trackingId, status: data?.tracking?.[0]?.message_en || 'unknown', raw: data };
  }

  async cancelShipment(): Promise<void> {}

  async getRates(request: RateRequest): Promise<RateResult> {
    const insideDhaka = /dhaka/i.test(request.district);
    return {
      provider: this.provider,
      price: insideDhaka ? 65 : 125,
      currency: 'BDT',
      estimatedDays: insideDhaka ? 1 : 3,
    };
  }
}
