import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export class RegisterDto {
  @ApiProperty({ example: 'Rahim Store' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rahim@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '01712345678' })
  @Matches(BD_PHONE, { message: 'phone must be a valid Bangladeshi number' })
  phone: string;

  @ApiProperty({ example: 'Secret123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'rahim@example.com' })
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or phone

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '01712345678' })
  @Matches(BD_PHONE)
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: '01712345678' })
  @Matches(BD_PHONE)
  phone: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '01712345678' })
  @Matches(BD_PHONE)
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'NewSecret123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
