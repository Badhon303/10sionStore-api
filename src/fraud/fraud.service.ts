import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FraudResult {
  phone: string;
  score: number;
  isFraud: boolean;
  shouldBlock: boolean;
  factors: Record<string, number>;
  note: string;
}

const WEIGHTS = {
  cancellationRate: 30,
  returnRate: 20,
  incompleteFrequency: 20,
  multiPhoneSession: 15,
  phonePattern: 15,
};

const FLAG_THRESHOLD = 70;
const BLOCK_THRESHOLD = 85;

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Score a customer 0-100 based on historical order behaviour.
   */
  async score(storeId: string, phone: string): Promise<FraudResult> {
    const customer = await this.prisma.customer.findUnique({
      where: { storeId_phone: { storeId, phone } },
    });

    const orders = customer
      ? await this.prisma.order.findMany({
          where: { customerId: customer.id },
          select: { status: true },
        })
      : [];

    const total = orders.length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    const returned = orders.filter((o) => o.status === 'RETURNED').length;

    const incompleteCount = await this.prisma.incompleteOrder.count({
      where: { storeId, phone },
    });

    // Multiple recent orders (last day) with different phones from same customer name
    let multiPhone = 0;
    if (customer?.name) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sameName = await this.prisma.customer.findMany({
        where: { storeId, name: customer.name, createdAt: { gte: since } },
        select: { phone: true },
      });
      const distinctPhones = new Set(sameName.map((c) => c.phone));
      if (distinctPhones.size > 1) multiPhone = Math.min(distinctPhones.size / 3, 1);
    }

    const cancellationRate = total ? cancelled / total : 0;
    const returnRate = total ? returned / total : 0;
    const incompleteFrequency = total + incompleteCount
      ? incompleteCount / (total + incompleteCount)
      : Math.min(incompleteCount / 5, 1);
    const phonePattern = this.matchesFraudPattern(phone) ? 1 : 0;

    const factors = {
      cancellationRate: cancellationRate * WEIGHTS.cancellationRate,
      returnRate: returnRate * WEIGHTS.returnRate,
      incompleteFrequency: incompleteFrequency * WEIGHTS.incompleteFrequency,
      multiPhoneSession: multiPhone * WEIGHTS.multiPhoneSession,
      phonePattern: phonePattern * WEIGHTS.phonePattern,
    };

    const score = Math.round(Object.values(factors).reduce((a, b) => a + b, 0));
    const isFraud = score > FLAG_THRESHOLD;
    const shouldBlock = score > BLOCK_THRESHOLD;
    const note = `Auto-scored: cancel=${(cancellationRate * 100).toFixed(0)}% return=${(returnRate * 100).toFixed(0)}% incomplete=${incompleteCount}`;

    if (customer) {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          fraudScore: score,
          isFraud,
          fraudNote: note,
          ...(shouldBlock ? { isBlocked: true } : {}),
        },
      });
    }

    return { phone, score, isFraud, shouldBlock, factors, note };
  }

  private matchesFraudPattern(phone: string): boolean {
    const normalized = phone.replace(/^\+?88/, '');
    // Repeated digits or sequential patterns are suspicious
    if (/(\d)\1{6,}/.test(normalized)) return true;
    if (/0123456|1234567|7654321/.test(normalized)) return true;
    return false;
  }

  async flagged(storeId: string) {
    return this.prisma.customer.findMany({
      where: { storeId, OR: [{ isFraud: true }, { isBlocked: true }] },
      orderBy: { fraudScore: 'desc' },
    });
  }

  async setBlocked(storeId: string, customerId: string, blocked: boolean) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, storeId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { isBlocked: blocked },
    });
  }

  async isBlocked(storeId: string, phone: string): Promise<boolean> {
    const c = await this.prisma.customer.findUnique({
      where: { storeId_phone: { storeId, phone } },
      select: { isBlocked: true },
    });
    return !!c?.isBlocked;
  }
}
