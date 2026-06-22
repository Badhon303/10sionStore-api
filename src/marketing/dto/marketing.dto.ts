import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  phones: string[];

  @ApiProperty()
  @IsString()
  message: string;
}

export class SendEmailDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  html: string;
}

export class SendWhatsappDto {
  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  message: string;
}

export class SmsCampaignDto {
  @ApiPropertyOptional({ type: [String], description: 'Explicit phones; if omitted, all store customers' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @ApiProperty()
  @IsString()
  message: string;
}

export class EmailCampaignDto {
  @ApiPropertyOptional({ type: [String], description: 'Explicit recipients; if omitted, all store customers with email' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  html: string;
}
