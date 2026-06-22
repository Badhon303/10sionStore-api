import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsResult {
  success: boolean;
  provider: string;
  ref?: string;
  error?: string;
}

/**
 * Bangladesh SMS gateway integration (SSL Wireless / Shohoz style).
 * Falls back to console logging in development when no API key is configured.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<SmsResult> {
    const apiKey = this.config.get<string>('SMS_API_KEY');
    const baseUrl = this.config.get<string>('SMS_BASE_URL');
    const sender = this.config.get<string>('SMS_SENDER_ID');

    if (!apiKey || !baseUrl) {
      this.logger.warn(`[DEV SMS] to=${phone} :: ${message}`);
      return { success: true, provider: 'console' };
    }

    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_token: apiKey,
          sid: sender,
          msisdn: phone,
          sms: message,
          csms_id: Date.now().toString(),
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      return { success: res.ok, provider: 'ssl', ref: data?.smsinfo?.[0]?.reference_id };
    } catch (err) {
      this.logger.error(`SMS send failed: ${(err as Error).message}`);
      return { success: false, provider: 'ssl', error: (err as Error).message };
    }
  }

  async sendBulk(phones: string[], message: string): Promise<SmsResult[]> {
    return Promise.all(phones.map((p) => this.send(p, message)));
  }
}
