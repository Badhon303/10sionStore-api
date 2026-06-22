import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { PixelType } from '@prisma/client';

export class TrackingConfigDto {
  @ApiProperty({ enum: PixelType })
  @IsEnum(PixelType)
  type: PixelType;

  @ApiProperty()
  @IsString()
  pixelId: string;

  @ApiPropertyOptional({ description: 'CAPI / Measurement Protocol access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FacebookEventDto {
  @ApiProperty({ example: 'Purchase' })
  @IsString()
  eventName: string;

  @ApiPropertyOptional({ type: Object, description: 'user_data (email/phone are hashed)' })
  @IsOptional()
  @IsObject()
  userData?: Record<string, any>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventSourceUrl?: string;
}

export class GoogleEventDto {
  @ApiProperty({ example: 'purchase' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'GA4 client_id' })
  @IsString()
  clientId: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}
