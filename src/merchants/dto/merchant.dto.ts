import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMerchantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional()
  @IsString()
  currentPassword: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
