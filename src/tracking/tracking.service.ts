import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FacebookEventDto, GoogleEventDto, TrackingConfigDto } from './dto/tracking.dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveConfig(storeId: string, dto: TrackingConfigDto) {
    const existing = await this.prisma.trackingPixel.findFirst({
      where: { storeId, type: dto.type },
    });
    if (existing) {
      return this.prisma.trackingPixel.update({
        where: { id: existing.id },
        data: {
          pixelId: dto.pixelId,
          accessToken: dto.accessToken,
          config: dto.config,
          isActive: dto.isActive ?? true,
        },
      });
    }
    return this.prisma.trackingPixel.create({
      data: {
        storeId,
        type: dto.type,
        pixelId: dto.pixelId,
        accessToken: dto.accessToken,
        config: dto.config,
        isActive: dto.isActive ?? true,
      },
    });
  }

  listConfigs(storeId: string) {
    return this.prisma.trackingPixel.findMany({ where: { storeId } });
  }

  private hash(value?: string): string | undefined {
    if (!value) return undefined;
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
  }

  /** Send a server-side event to the Facebook Conversions API. */
  async sendFacebookEvent(storeId: string, dto: FacebookEventDto) {
    const pixel = await this.prisma.trackingPixel.findFirst({
      where: { storeId, type: 'FACEBOOK_CAPI', isActive: true },
    });
    if (!pixel || !pixel.accessToken) {
      throw new BadRequestException('Facebook CAPI is not configured');
    }

    const userData: Record<string, any> = {};
    if (dto.userData?.email) userData.em = [this.hash(dto.userData.email)];
    if (dto.userData?.phone) userData.ph = [this.hash(dto.userData.phone)];
    if (dto.userData?.clientIp) userData.client_ip_address = dto.userData.clientIp;
    if (dto.userData?.userAgent) userData.client_user_agent = dto.userData.userAgent;

    const payload = {
      data: [
        {
          event_name: dto.eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: dto.eventSourceUrl,
          user_data: userData,
          custom_data: dto.customData || {},
        },
      ],
    };

    const url = `https://graph.facebook.com/v19.0/${pixel.pixelId}/events?access_token=${pixel.accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) this.logger.warn(`FB CAPI error: ${JSON.stringify(data)}`);
    return { sent: res.ok, response: data };
  }

  /** Send an event to GA4 via the Measurement Protocol. */
  async sendGoogleEvent(storeId: string, dto: GoogleEventDto) {
    const pixel = await this.prisma.trackingPixel.findFirst({
      where: { storeId, type: 'GOOGLE_TAG_MANAGER', isActive: true },
    });
    if (!pixel || !pixel.accessToken) {
      throw new BadRequestException('Google measurement protocol is not configured (need api_secret as accessToken)');
    }
    const measurementId = pixel.pixelId;
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${pixel.accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: dto.clientId,
        events: [{ name: dto.name, params: dto.params || {} }],
      }),
    });
    return { sent: res.ok };
  }
}
