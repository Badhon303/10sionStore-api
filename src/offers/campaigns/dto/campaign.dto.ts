import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { CampaignType } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: CampaignType })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiProperty({
    type: Object,
    description:
      'flash sale: { productIds, discountPct } | combo: { productIds[], bundlePrice } | popup: { delaySeconds, code }',
  })
  @IsObject()
  config: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}
