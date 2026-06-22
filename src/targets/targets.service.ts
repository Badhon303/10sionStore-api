import { Injectable } from '@nestjs/common';
import { Prisma, TargetPeriod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateTargetDto {
  @ApiProperty({ enum: TargetPeriod })
  @IsEnum(TargetPeriod)
  period: TargetPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  month?: number;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsNumber()
  salesTarget: number;

  @ApiProperty()
  @IsInt()
  orderTarget: number;
}

@Injectable()
export class TargetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(storeId: string, dto: CreateTargetDto) {
    return this.prisma.target.create({
      data: {
        storeId,
        period: dto.period,
        month: dto.month,
        year: dto.year,
        salesTarget: new Prisma.Decimal(dto.salesTarget),
        orderTarget: dto.orderTarget,
      },
    });
  }

  findAll(storeId: string) {
    return this.prisma.target.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  remove(storeId: string, id: string) {
    return this.prisma.target.deleteMany({ where: { id, storeId } });
  }
}
