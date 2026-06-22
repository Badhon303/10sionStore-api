import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class SaveIncompleteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ type: Object, description: 'Snapshot of attempted cart' })
  @IsObject()
  cartData: Record<string, any>;

  @ApiProperty({ description: 'Checkout step they abandoned at' })
  @IsString()
  step: string;
}

@Injectable()
export class IncompleteOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async save(storeId: string, dto: SaveIncompleteDto) {
    let customerId: string | undefined;
    if (dto.phone) {
      const customer = await this.prisma.customer.findUnique({
        where: { storeId_phone: { storeId, phone: dto.phone } },
      });
      customerId = customer?.id;
    }
    return this.prisma.incompleteOrder.create({
      data: {
        storeId,
        customerId,
        productId: dto.productId,
        phone: dto.phone,
        name: dto.name,
        cartData: dto.cartData as Prisma.InputJsonValue,
        step: dto.step,
      },
    });
  }

  list(storeId: string, isFollowedUp?: boolean) {
    return this.prisma.incompleteOrder.findMany({
      where: { storeId, ...(isFollowedUp !== undefined ? { isFollowedUp } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  markFollowedUp(storeId: string, id: string) {
    return this.prisma.incompleteOrder.updateMany({
      where: { id, storeId },
      data: { isFollowedUp: true },
    });
  }

  remove(storeId: string, id: string) {
    return this.prisma.incompleteOrder.deleteMany({ where: { id, storeId } });
  }
}
