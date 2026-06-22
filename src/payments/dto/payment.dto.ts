import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class PaymentConfigDto {
  @ApiProperty({ description: 'bkash | nagad | sslcommerz | paystation' })
  @IsString()
  provider: string;

  @ApiProperty({ type: Object, description: 'Gateway credentials (encrypted at rest)' })
  @IsObject()
  config: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class InitiatePaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ description: 'Amount override; defaults to order total' })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
