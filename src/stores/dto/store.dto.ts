import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { PlanType } from '@prisma/client';

export class CreateStoreDto {
  @ApiProperty({ example: 'Rahim Fashion' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'rahim-fashion', description: 'Auto-generated if omitted' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 'BDT' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: PlanType })
  @IsOptional()
  @IsEnum(PlanType)
  plan?: PlanType;

  @ApiPropertyOptional({ type: Object, description: 'theme, SEO, social links, contact' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetDomainDto {
  @ApiProperty({ example: 'shop.rahimfashion.com' })
  @IsString()
  @IsNotEmpty()
  domain: string;
}
