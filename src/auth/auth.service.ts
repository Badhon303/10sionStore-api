import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../marketing/sms/sms.service';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
  ) {}

  private async issueTokens(payload: {
    sub: string;
    email: string;
    role: string;
    type: 'merchant' | 'employee';
    storeId?: string;
  }) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const refreshToken = randomUUID() + '.' + randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, merchantId: payload.sub, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.merchant.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (exists) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const merchant = await this.prisma.merchant.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, passwordHash },
    });

    await this.createAndSendOtp(merchant.id, merchant.phone, 'VERIFY');

    const tokens = await this.issueTokens({
      sub: merchant.id,
      email: merchant.email,
      role: merchant.role,
      type: 'merchant',
    });

    return {
      merchant: { id: merchant.id, name: merchant.name, email: merchant.email, phone: merchant.phone },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { OR: [{ email: dto.identifier }, { phone: dto.identifier }] },
    });
    if (!merchant || !merchant.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, merchant.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens({
      sub: merchant.id,
      email: merchant.email,
      role: merchant.role,
      type: 'merchant',
    });

    return {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        isVerified: merchant.isVerified,
        role: merchant.role,
      },
      ...tokens,
    };
  }

  async refresh(dto: RefreshDto) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { merchant: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = await this.issueTokens({
      sub: stored.merchant.id,
      email: stored.merchant.email,
      role: stored.merchant.role,
      type: 'merchant',
    });
    return tokens;
  }

  async logout(dto: RefreshDto) {
    await this.prisma.refreshToken.deleteMany({ where: { token: dto.refreshToken } });
    return { message: 'Logged out' };
  }

  private async createAndSendOtp(merchantId: string | null, phone: string, purpose: 'VERIFY' | 'RESET') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.prisma.otp.create({
      data: { merchantId: merchantId ?? undefined, phone, code, purpose, expiresAt },
    });
    await this.sms.send(phone, `Your StoreX verification code is ${code}. Valid for 5 minutes.`);
    return code;
  }

  private async consumeOtp(phone: string, code: string, purpose: 'VERIFY' | 'RESET') {
    const otp = await this.prisma.otp.findFirst({
      where: { phone, code, purpose, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.prisma.otp.update({ where: { id: otp.id }, data: { consumed: true } });
    return otp;
  }

  async verifyOtp(dto: VerifyOtpDto) {
    await this.consumeOtp(dto.phone, dto.code, 'VERIFY');
    await this.prisma.merchant.updateMany({
      where: { phone: dto.phone },
      data: { isVerified: true },
    });
    return { message: 'Phone verified' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { phone: dto.phone } });
    if (!merchant) {
      throw new NotFoundException('No account with that phone');
    }
    await this.createAndSendOtp(merchant.id, dto.phone, 'RESET');
    return { message: 'OTP sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.consumeOtp(dto.phone, dto.code, 'RESET');
    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.merchant.updateMany({
      where: { phone: dto.phone },
      data: { passwordHash },
    });
    // Invalidate all refresh tokens
    const merchant = await this.prisma.merchant.findUnique({ where: { phone: dto.phone } });
    if (merchant) {
      await this.prisma.refreshToken.deleteMany({ where: { merchantId: merchant.id } });
    }
    return { message: 'Password reset successful' };
  }
}
