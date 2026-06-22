import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SmsService } from './sms/sms.service';
import { EmailService } from './email/email.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import {
  EmailCampaignDto,
  SendEmailDto,
  SendSmsDto,
  SendWhatsappDto,
  SmsCampaignDto,
} from './dto/marketing.dto';
import { JOB_BULK_EMAIL, JOB_BULK_SMS, QUEUE_MARKETING } from '../queue/queue.constants';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/marketing')
export class MarketingController {
  constructor(
    private readonly sms: SmsService,
    private readonly email: EmailService,
    private readonly whatsapp: WhatsappService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_MARKETING) private readonly marketingQueue: Queue,
  ) {}

  @Post('sms/send')
  sendSms(@Body() dto: SendSmsDto) {
    return this.sms.sendBulk(dto.phones, dto.message);
  }

  @Post('sms/campaign')
  async smsCampaign(@Param('storeId') storeId: string, @Body() dto: SmsCampaignDto) {
    let phones = dto.phones;
    if (!phones?.length) {
      const customers = await this.prisma.customer.findMany({
        where: { storeId, isBlocked: false },
        select: { phone: true },
      });
      phones = customers.map((c) => c.phone);
    }
    const job = await this.marketingQueue.add(JOB_BULK_SMS, { phones, message: dto.message });
    return { queued: true, jobId: job.id, recipients: phones.length };
  }

  @Post('email/send')
  sendEmail(@Body() dto: SendEmailDto) {
    return this.email.sendBulk(dto.recipients, dto.subject, dto.html);
  }

  @Post('email/campaign')
  async emailCampaign(@Param('storeId') storeId: string, @Body() dto: EmailCampaignDto) {
    let recipients = dto.recipients;
    if (!recipients?.length) {
      const customers = await this.prisma.customer.findMany({
        where: { storeId, email: { not: null } },
        select: { email: true },
      });
      recipients = customers.map((c) => c.email!).filter(Boolean);
    }
    const job = await this.marketingQueue.add(JOB_BULK_EMAIL, {
      recipients,
      subject: dto.subject,
      html: dto.html,
    });
    return { queued: true, jobId: job.id, recipients: recipients.length };
  }

  @Post('whatsapp/send')
  sendWhatsapp(@Body() dto: SendWhatsappDto) {
    return this.whatsapp.send(dto.phone, dto.message);
  }

  @Get('campaigns')
  async campaigns() {
    const counts = await this.marketingQueue.getJobCounts();
    return { queue: QUEUE_MARKETING, counts };
  }
}
