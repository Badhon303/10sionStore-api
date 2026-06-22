import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class OrderItemInput {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  shippingName: string;

  @ApiProperty()
  @IsString()
  shippingPhone: string;

  @ApiProperty()
  @IsString()
  shippingAddress: string;

  @ApiProperty()
  @IsString()
  shippingDistrict: string;

  @ApiProperty()
  @IsString()
  shippingThana: string;

  @ApiPropertyOptional({ description: 'Customer email (optional)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ default: 'COD' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  shippingCharge?: number;

  @ApiProperty({ type: [OrderItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

export class UpdateStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class BulkStatusDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class OrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'ISO date (from)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date (to)' })
  @IsOptional()
  @IsString()
  to?: string;
}
