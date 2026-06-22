import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minOrderAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  perUserLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Cart subtotal to validate against' })
  @IsNumber()
  subtotal: number;

  @ApiPropertyOptional({ description: 'Customer phone for per-user limit checks' })
  @IsOptional()
  @IsString()
  phone?: string;
}
