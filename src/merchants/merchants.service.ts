import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, UpdateMerchantDto } from './dto/merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        stores: { select: { id: true, name: true, slug: true, plan: true } },
      },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async update(id: string, dto: UpdateMerchantDto) {
    return this.prisma.merchant.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException('Merchant not found');
    const ok = await bcrypt.compare(dto.currentPassword, merchant.passwordHash);
    if (!ok) throw new BadRequestException('Current password incorrect');
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.merchant.update({ where: { id }, data: { passwordHash } });
    await this.prisma.refreshToken.deleteMany({ where: { merchantId: id } });
    return { message: 'Password changed' };
  }
}
