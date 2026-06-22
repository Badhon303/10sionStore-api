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
export class SteadfastAdapter implements CourierAdapter {
  readonly provider = 'steadfast';
  private readonly logger = new Logger(SteadfastAdapter.name);
  private readonly baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1';

  private headers(config: Record<string, any>) {
    return {
      'Content-Type': 'application/json',
      'Api-Key': config.apiKey || process.env.STEADFAST_API_KEY || '',
      'Secret-Key': config.secretKey || process.env.STEADFAST_SECRET_KEY || '',
    };
  }

  async bookShipment(order: Order, config: Record<string, any>): Promise<CourierBookingResult> {
    const res = await fetch(`${this.baseUrl}/create_order`, {
      method: 'POST',
      headers: this.headers(config),
      body: JSON.stringify({
        invoice: order.orderNumber,
        recipient_name: order.shippingName,
        recipient_phone: order.shippingPhone,
        recipient_address: `${order.shippingAddress}, ${order.shippingThana}, ${order.shippingDistrict}`,
        cod_amount: Number(order.total),
        note: order.note || '',
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`Steadfast booking failed: ${JSON.stringify(data)}`);
      throw new Error(data?.message || 'Steadfast booking failed');
    }
    return {
      trackingId: data?.consignment?.tracking_code || data?.consignment?.consignment_id?.toString(),
      status: data?.consignment?.status || 'booked',
      raw: data,
    };
  }

  async trackShipment(trackingId: string, config: Record<string, any>): Promise<TrackingStatus> {
    const res = await fetch(`${this.baseUrl}/status_by_trackingcode/${trackingId}`, {
      headers: this.headers(config),
    });
    const data: any = await res.json().catch(() => ({}));
    return { trackingId, status: data?.delivery_status || 'unknown', raw: data };
  }

  async cancelShipment(): Promise<void> {
    // Steadfast does not expose a public cancel endpoint; no-op.
  }

  async getRates(request: RateRequest): Promise<RateResult> {
    // Steadfast has flat-rate pricing zones; approximate.
    const insideDhaka = /dhaka/i.test(request.district);
    return {
      provider: this.provider,
      price: insideDhaka ? 60 : 120,
      currency: 'BDT',
      estimatedDays: insideDhaka ? 1 : 3,
    };
  }
}
