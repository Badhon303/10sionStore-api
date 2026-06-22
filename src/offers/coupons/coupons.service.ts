import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

export interface CouponValidation {
  valid: boolean;
  code: string;
  discount: number;
  freeShipping: boolean;
  reason?: string;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  create(storeId: string, dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        storeId,
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: new Prisma.Decimal(dto.value),
        minOrderAmount: dto.minOrderAmount != null ? new Prisma.Decimal(dto.minOrderAmount) : null,
        maxDiscount: dto.maxDiscount != null ? new Prisma.Decimal(dto.maxDiscount) : null,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  findAll(storeId: string) {
    return this.prisma.coupon.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(storeId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id, storeId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(storeId: string, id: string, dto: UpdateCouponDto) {
    await this.findOne(storeId, id);
    const data: any = { ...dto };
    if (dto.code) data.code = dto.code.toUpperCase();
    if (dto.value != null) data.value = new Prisma.Decimal(dto.value);
    if (dto.minOrderAmount != null) data.minOrderAmount = new Prisma.Decimal(dto.minOrderAmount);
    if (dto.maxDiscount != null) data.maxDiscount = new Prisma.Decimal(dto.maxDiscount);
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id);
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted' };
  }

  /**
   * Validate a coupon against a cart subtotal. Returns the computed discount.
   */
  async validate(storeId: string, dto: ValidateCouponDto): Promise<CouponValidation> {
    const code = dto.code.toUpperCase();
    const coupon = await this.prisma.coupon.findFirst({ where: { storeId, code } });
    const fail = (reason: string): CouponValidation => ({
      valid: false,
      code,
      discount: 0,
      freeShipping: false,
      reason,
    });

    if (!coupon || !coupon.isActive) return fail('Coupon not found or inactive');
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) return fail('Coupon not yet active');
    if (coupon.expiresAt && coupon.expiresAt < now) return fail('Coupon expired');
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
      return fail('Coupon usage limit reached');
    if (coupon.minOrderAmount && dto.subtotal < Number(coupon.minOrderAmount))
      return fail(`Minimum order amount is ${coupon.minOrderAmount}`);

    if (dto.phone && coupon.perUserLimit) {
      const usedByUser = await this.prisma.order.count({
        where: { storeId, couponCode: code, shippingPhone: dto.phone },
      });
      if (usedByUser >= coupon.perUserLimit) return fail('Per-user usage limit reached');
    }

    let discount = 0;
    let freeShipping = false;
    const value = Number(coupon.value);
    switch (coupon.type) {
      case 'PERCENTAGE':
        discount = (dto.subtotal * value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
        break;
      case 'FIXED':
        discount = Math.min(value, dto.subtotal);
        break;
      case 'FREE_SHIPPING':
        freeShipping = true;
        break;
    }

    return { valid: true, code, discount: Math.round(discount * 100) / 100, freeShipping };
  }

  async incrementUsage(storeId: string, code: string) {
    await this.prisma.coupon.updateMany({
      where: { storeId, code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  }
}
