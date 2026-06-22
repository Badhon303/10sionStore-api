import { Injectable, Logger } from '@nestjs/common';
import { PaymentInitResult } from './bkash.gateway';

/**
 * Nagad payment integration (simplified).
 * Nagad uses RSA encryption for the checkout init handshake; the merchant private
 * key is supplied via config. This implementation outlines the init/verify flow.
 */
@Injectable()
export class NagadGateway {
  readonly provider = 'nagad';
  private readonly logger = new Logger(NagadGateway.name);
  private readonly baseUrl = process.env.NAGAD_BASE_URL || 'https://api.mynagad.com/api/dfs';

  async initiate(
    config: Record<string, any>,
    params: { amount: number; orderNumber: string; callbackUrl: string },
  ): Promise<PaymentInitResult> {
    const merchantId = config.merchantId || process.env.NAGAD_MERCHANT_ID;
    try {
      const initRes = await fetch(
        `${this.baseUrl}/check-out/initialize/${merchantId}/${params.orderNumber}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-KM-Api-Version': 'v-0.2.0' },
          body: JSON.stringify({ merchantId, orderId: params.orderNumber }),
        },
      );
      const data: any = await initRes.json().catch(() => ({}));
      const redirectUrl = data?.callBackUrl || params.callbackUrl;
      return { provider: this.provider, redirectUrl, paymentId: data?.paymentReferenceId, raw: data };
    } catch (err) {
      this.logger.error(`Nagad init failed: ${(err as Error).message}`);
      throw new Error('Nagad payment init failed');
    }
  }

  async verify(config: Record<string, any>, paymentRefId: string) {
    const res = await fetch(`${this.baseUrl}/verify/payment/${paymentRefId}`, {
      headers: { 'X-KM-Api-Version': 'v-0.2.0' },
    });
    return res.json().catch(() => ({}));
  }
}
