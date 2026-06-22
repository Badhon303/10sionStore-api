import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(storeId: string) {
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const rangeStats = async (from: Date) => {
      const orders = await this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: from }, status: { not: 'CANCELLED' } },
        select: { total: true },
      });
      const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const count = orders.length;
      return { orders: count, revenue, avgOrderValue: count ? revenue / count : 0 };
    };

    const [todayStats, weekStats, monthStats, totalCustomers] = await Promise.all([
      rangeStats(today),
      rangeStats(weekAgo),
      rangeStats(monthStart),
      this.prisma.customer.count({ where: { storeId } }),
    ]);

    return {
      today: todayStats,
      thisWeek: weekStats,
      thisMonth: monthStats,
      totalCustomers,
    };
  }

  private parseRange(from?: string, to?: string) {
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  async ordersChart(storeId: string, from?: string, to?: string) {
    const { start, end } = this.parseRange(from, to);
    const orders = await this.prisma.order.findMany({
      where: { storeId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    });
    return this.bucketByDay(orders.map((o) => ({ date: o.createdAt, value: 1 })));
  }

  async revenueChart(storeId: string, from?: string, to?: string) {
    const { start, end } = this.parseRange(from, to);
    const orders = await this.prisma.order.findMany({
      where: { storeId, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
      select: { createdAt: true, total: true },
    });
    return this.bucketByDay(orders.map((o) => ({ date: o.createdAt, value: Number(o.total) })));
  }

  private bucketByDay(rows: { date: Date; value: number }[]) {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.date.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + r.value);
    }
    return Array.from(map.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async topProducts(storeId: string, limit = 10) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: { storeId, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    return grouped.map((g) => ({
      productId: g.productId,
      productName: g.productName,
      unitsSold: g._sum.quantity || 0,
      revenue: Number(g._sum.total || 0),
    }));
  }

  async orderFunnel(storeId: string) {
    const [incomplete, total, delivered, cancelled, returned] = await Promise.all([
      this.prisma.incompleteOrder.count({ where: { storeId } }),
      this.prisma.order.count({ where: { storeId } }),
      this.prisma.order.count({ where: { storeId, status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { storeId, status: 'CANCELLED' } }),
      this.prisma.order.count({ where: { storeId, status: 'RETURNED' } }),
    ]);
    return { incompleteOrders: incomplete, orders: total, delivered, cancelled, returned };
  }

  async employeePerformance(storeId: string) {
    const grouped = await this.prisma.order.groupBy({
      by: ['employeeId'],
      where: { storeId, employeeId: { not: null } },
      _count: { _all: true },
      _sum: { total: true },
    });
    const employees = await this.prisma.employee.findMany({
      where: { storeId },
      select: { id: true, name: true },
    });
    const nameMap = new Map(employees.map((e) => [e.id, e.name]));
    return grouped.map((g) => ({
      employeeId: g.employeeId,
      employeeName: g.employeeId ? nameMap.get(g.employeeId) : null,
      ordersHandled: g._count._all,
      revenue: Number(g._sum.total || 0),
    }));
  }

  async targetVsActual(storeId: string) {
    const now = new Date();
    const targets = await this.prisma.target.findMany({ where: { storeId, year: now.getFullYear() } });
    const results: Array<{
      period: string;
      month: number | null;
      year: number;
      salesTarget: number;
      actualSales: number;
      salesProgress: number;
      orderTarget: number;
      actualOrders: number;
    }> = [];
    for (const t of targets) {
      let start: Date;
      let end: Date;
      if (t.period === 'MONTHLY' && t.month) {
        start = new Date(t.year, t.month - 1, 1);
        end = new Date(t.year, t.month, 1);
      } else if (t.period === 'YEARLY') {
        start = new Date(t.year, 0, 1);
        end = new Date(t.year + 1, 0, 1);
      } else {
        start = startOfDay(now);
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      }
      const orders = await this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: start, lt: end }, status: { not: 'CANCELLED' } },
        select: { total: true },
      });
      const actualSales = orders.reduce((s, o) => s + Number(o.total), 0);
      results.push({
        period: t.period,
        month: t.month,
        year: t.year,
        salesTarget: Number(t.salesTarget),
        actualSales,
        salesProgress: Number(t.salesTarget) ? (actualSales / Number(t.salesTarget)) * 100 : 0,
        orderTarget: t.orderTarget,
        actualOrders: orders.length,
      });
    }
    return results;
  }

  async fraudSummary(storeId: string) {
    const blocked = await this.prisma.customer.count({ where: { storeId, isBlocked: true } });
    const flagged = await this.prisma.customer.count({ where: { storeId, isFraud: true } });
    const fraudOrders = await this.prisma.order.findMany({
      where: { storeId, isFraud: true },
      select: { total: true },
    });
    const estimatedSavings = fraudOrders.reduce((s, o) => s + Number(o.total), 0);
    return {
      blockedCustomers: blocked,
      flaggedCustomers: flagged,
      flaggedOrders: fraudOrders.length,
      estimatedSavings,
    };
  }
}
