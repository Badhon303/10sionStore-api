import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

const TYPE_TO_EVENT: Record<NotificationType, string> = {
  NEW_ORDER: 'new_order',
  LOW_STOCK: 'low_stock',
  FRAUD_DETECTED: 'fraud_detected',
  COURIER_STATUS: 'order_status_changed',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM: 'system',
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async push(params: {
    storeId: string;
    type: NotificationType;
    title: string;
    body: string;
    meta?: Prisma.InputJsonValue;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        storeId: params.storeId,
        type: params.type,
        title: params.title,
        body: params.body,
        meta: params.meta,
      },
    });
    this.gateway.emitToStore(params.storeId, TYPE_TO_EVENT[params.type], notification);
    return notification;
  }

  async list(storeId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: { storeId, ...(onlyUnread ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(storeId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, storeId },
      data: { isRead: true },
    });
  }

  async markAllRead(storeId: string) {
    return this.prisma.notification.updateMany({
      where: { storeId, isRead: false },
      data: { isRead: true },
    });
  }
}
