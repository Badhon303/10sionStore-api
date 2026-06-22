import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CourierConfigDto {
  @ApiProperty({ description: 'pathao | steadfast | redx | ecourier | bahok' })
  @IsString()
  provider: string;

  @ApiProperty({ type: Object, description: 'Provider API credentials' })
  @IsObject()
  config: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BookShipmentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Courier provider to use' })
  @IsString()
  provider: string;
}

export class BulkBookDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @ApiProperty()
  @IsString()
  provider: string;
}

export class RateQueryDto {
  @ApiProperty()
  @IsString()
  district: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thana?: string;
}

export class ReturnDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
