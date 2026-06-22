import { Order } from '@prisma/client';

export interface CourierBookingResult {
  trackingId: string;
  status: string;
  raw?: any;
}

export interface TrackingStatus {
  trackingId: string;
  status: string;
  history?: { status: string; time?: string }[];
  raw?: any;
}

export interface RateRequest {
  district: string;
  thana?: string;
  weight?: number;
  codAmount?: number;
}

export interface RateResult {
  provider: string;
  price: number;
  currency: string;
  estimatedDays?: number;
}

export interface CourierAdapter {
  readonly provider: string;
  bookShipment(order: Order, config: Record<string, any>): Promise<CourierBookingResult>;
  trackShipment(trackingId: string, config: Record<string, any>): Promise<TrackingStatus>;
  cancelShipment(trackingId: string, config: Record<string, any>): Promise<void>;
  getRates(request: RateRequest, config: Record<string, any>): Promise<RateResult>;
}
