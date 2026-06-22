import { Injectable, Logger } from '@nestjs/common';

export interface PaymentInitResult {
  provider: string;
  redirectUrl?: string;
  paymentId?: string;
  raw?: any;
}

/** bKash Tokenized Checkout (PGW) integration. */
@Injectable()
export class BkashGateway {
  readonly provider = 'bkash';
  private readonly logger = new Logger(BkashGateway.name);
  private readonly baseUrl = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

  private async grantToken(config: Record<string, any>): Promise<string> {
    const res = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: config.username,
        password: config.password,
      },
      body: JSON.stringify({ app_key: config.appKey, app_secret: config.appSecret }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!data?.id_token) throw new Error('bKash token grant failed');
    return data.id_token;
  }

  async initiate(
    config: Record<string, any>,
    params: { amount: number; orderNumber: string; callbackUrl: string },
  ): Promise<PaymentInitResult> {
    const token = await this.grantToken(config);
    const res = await fetch(`${this.baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': config.appKey,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: params.orderNumber,
        callbackURL: params.callbackUrl,
        amount: params.amount.toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: params.orderNumber,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.bkashURL) {
      this.logger.error(`bKash create failed: ${JSON.stringify(data)}`);
      throw new Error(data?.statusMessage || 'bKash payment creation failed');
    }
    return { provider: this.provider, redirectUrl: data.bkashURL, paymentId: data.paymentID, raw: data };
  }

  async executePayment(config: Record<string, any>, paymentId: string) {
    const token = await this.grantToken(config);
    const res = await fetch(`${this.baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': config.appKey,
      },
      body: JSON.stringify({ paymentID: paymentId }),
    });
    return res.json().catch(() => ({}));
  }
}
