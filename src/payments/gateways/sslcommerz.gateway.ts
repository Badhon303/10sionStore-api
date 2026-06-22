import { Injectable, Logger } from '@nestjs/common';
import { PaymentInitResult } from './bkash.gateway';

/** SSLCommerz hosted checkout integration. */
@Injectable()
export class SslcommerzGateway {
  readonly provider = 'sslcommerz';
  private readonly logger = new Logger(SslcommerzGateway.name);

  private baseUrl(config: Record<string, any>) {
    const sandbox = config.sandbox ?? process.env.SSLCOMMERZ_SANDBOX === 'true';
    return sandbox ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
  }

  async initiate(
    config: Record<string, any>,
    params: {
      amount: number;
      orderNumber: string;
      successUrl: string;
      failUrl: string;
      ipnUrl: string;
      customer: { name: string; phone: string; address: string };
    },
  ): Promise<PaymentInitResult> {
    const body = new URLSearchParams({
      store_id: config.storeId || process.env.SSLCOMMERZ_STORE_ID || '',
      store_passwd: config.storePassword || process.env.SSLCOMMERZ_STORE_PASSWORD || '',
      total_amount: params.amount.toFixed(2),
      currency: 'BDT',
      tran_id: params.orderNumber,
      success_url: params.successUrl,
      fail_url: params.failUrl,
      cancel_url: params.failUrl,
      ipn_url: params.ipnUrl,
      cus_name: params.customer.name,
      cus_phone: params.customer.phone,
      cus_add1: params.customer.address,
      shipping_method: 'Courier',
      product_name: 'Order',
      product_category: 'ecommerce',
      product_profile: 'general',
    });

    const res = await fetch(`${this.baseUrl(config)}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data: any = await res.json().catch(() => ({}));
    if (data?.status !== 'SUCCESS' || !data?.GatewayPageURL) {
      this.logger.error(`SSLCommerz init failed: ${JSON.stringify(data)}`);
      throw new Error(data?.failedreason || 'SSLCommerz init failed');
    }
    return { provider: this.provider, redirectUrl: data.GatewayPageURL, paymentId: data.sessionkey, raw: data };
  }

  async validateIpn(config: Record<string, any>, valId: string) {
    const storeId = config.storeId || process.env.SSLCOMMERZ_STORE_ID;
    const storePass = config.storePassword || process.env.SSLCOMMERZ_STORE_PASSWORD;
    const url = `${this.baseUrl(config)}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePass}&format=json`;
    const res = await fetch(url);
    return res.json().catch(() => ({}));
  }
}
