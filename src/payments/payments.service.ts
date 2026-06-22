import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { encryptJson, decryptJson } from '../common/utils/crypto.util';
import { BkashGateway } from './gateways/bkash.gateway';
import { NagadGateway } from './gateways/nagad.gateway';
import { SslcommerzGateway } from './gateways/sslcommerz.gateway';
import { InitiatePaymentDto, PaymentConfigDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly bkash: BkashGateway,
    private readonly nagad: NagadGateway,
    private readonly sslcommerz: SslcommerzGateway,
  ) {}

  private get apiBase() {
    return `${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}`;
  }

  async saveConfig(storeId: string, dto: PaymentConfigDto) {
    return this.prisma.paymentConfig.upsert({
      where: { storeId_provider: { storeId, provider: dto.provider } },
      update: { config: { enc: encryptJson(dto.config) }, isActive: dto.isActive ?? true },
      create: {
        storeId,
        provider: dto.provider,
        config: { enc: encryptJson(dto.config) },
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listConfigs(storeId: string) {
    const configs = await this.prisma.paymentConfig.findMany({ where: { storeId } });
    return configs.map((c) => ({ id: c.id, provider: c.provider, isActive: c.isActive }));
  }

  private async resolveConfig(storeId: string, provider: string): Promise<Record<string, any>> {
    const row = await this.prisma.paymentConfig.findUnique({
      where: { storeId_provider: { storeId, provider } },
    });
    if (!row || !row.isActive) throw new BadRequestException(`${provider} is not configured/active`);
    const stored = row.config as any;
    return stored?.enc ? decryptJson(stored.enc) : stored;
  }

  private async getOrder(storeId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { store: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async recordPayment(orderId: string, provider: string, amount: number, gatewayRef?: string) {
    return this.prisma.payment.create({
      data: {
        orderId,
        method: provider,
        amount: new Prisma.Decimal(amount),
        status: 'UNPAID',
        gatewayRef,
      },
    });
  }

  async initiateBkash(storeId: string, dto: InitiatePaymentDto) {
    const order = await this.getOrder(storeId, dto.orderId);
    const config = await this.resolveConfig(storeId, 'bkash');
    const amount = dto.amount ?? Number(order.total);
    const result = await this.bkash.initiate(config, {
      amount,
      orderNumber: order.orderNumber,
      callbackUrl: `${this.apiBase}/api/v1/stores/${storeId}/payments/bkash/callback`,
    });
    await this.recordPayment(order.id, 'bkash', amount, result.paymentId);
    return result;
  }

  async initiateNagad(storeId: string, dto: InitiatePaymentDto) {
    const order = await this.getOrder(storeId, dto.orderId);
    const config = await this.resolveConfig(storeId, 'nagad');
    const amount = dto.amount ?? Number(order.total);
    const result = await this.nagad.initiate(config, {
      amount,
      orderNumber: order.orderNumber,
      callbackUrl: `${this.apiBase}/api/v1/stores/${storeId}/payments/nagad/callback`,
    });
    await this.recordPayment(order.id, 'nagad', amount, result.paymentId);
    return result;
  }

  async initiateSslcommerz(storeId: string, dto: InitiatePaymentDto) {
    const order = await this.getOrder(storeId, dto.orderId);
    const config = await this.resolveConfig(storeId, 'sslcommerz');
    const amount = dto.amount ?? Number(order.total);
    const result = await this.sslcommerz.initiate(config, {
      amount,
      orderNumber: order.orderNumber,
      successUrl: `${this.apiBase}/api/v1/stores/${storeId}/payments/sslcommerz/ipn`,
      failUrl: `${this.apiBase}/api/v1/stores/${storeId}/payments/sslcommerz/ipn`,
      ipnUrl: `${this.apiBase}/api/v1/stores/${storeId}/payments/sslcommerz/ipn`,
      customer: {
        name: order.shippingName,
        phone: order.shippingPhone,
        address: order.shippingAddress,
      },
    });
    await this.recordPayment(order.id, 'sslcommerz', amount, result.paymentId);
    return result;
  }

  /** Mark an order paid following a verified gateway callback. */
  async settle(storeId: string, orderNumber: string, provider: string, transactionId: string, payload: any) {
    const order = await this.prisma.order.findFirst({ where: { storeId, orderNumber } });
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.payment.updateMany({
      where: { orderId: order.id, method: provider },
      data: { status: 'PAID', transactionId, gatewayData: payload },
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID' },
    });
    await this.notifications.push({
      storeId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment received',
      body: `Order ${orderNumber} paid via ${provider}`,
      meta: { orderId: order.id, transactionId },
    });
    return { settled: true, orderId: order.id };
  }

  async handleBkashCallback(storeId: string, query: any) {
    if (query.status !== 'success' || !query.paymentID) {
      return { success: false, status: query.status };
    }
    const config = await this.resolveConfig(storeId, 'bkash');
    const executed = await this.bkash.executePayment(config, query.paymentID);
    if (executed?.transactionStatus === 'Completed') {
      await this.settle(
        storeId,
        executed.merchantInvoiceNumber,
        'bkash',
        executed.trxID,
        executed,
      );
      return { success: true, trxId: executed.trxID };
    }
    return { success: false, raw: executed };
  }

  async handleSslcommerzIpn(storeId: string, body: any) {
    if (body.status !== 'VALID' && body.status !== 'VALIDATED') {
      return { success: false, status: body.status };
    }
    const config = await this.resolveConfig(storeId, 'sslcommerz');
    const validation = await this.sslcommerz.validateIpn(config, body.val_id);
    if (validation?.status === 'VALID' || validation?.status === 'VALIDATED') {
      await this.settle(storeId, body.tran_id, 'sslcommerz', body.bank_tran_id || body.tran_id, validation);
      return { success: true };
    }
    return { success: false, raw: validation };
  }

  async handleNagadCallback(storeId: string, query: any) {
    const config = await this.resolveConfig(storeId, 'nagad');
    const verified = await this.nagad.verify(config, query.payment_ref_id || query.paymentRefId);
    if (verified?.status === 'Success') {
      await this.settle(storeId, verified.orderId, 'nagad', verified.issuerPaymentRefNo, verified);
      return { success: true };
    }
    return { success: false, raw: verified };
  }
}
