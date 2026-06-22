import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string) {
    const token = this.config.get<string>('WHATSAPP_API_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_ID');
    if (!token || !phoneId) {
      this.logger.warn(`[DEV WHATSAPP] to=${phone} :: ${message}`);
      return { success: true, provider: 'console' };
    }
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok, response: data };
  }
}
