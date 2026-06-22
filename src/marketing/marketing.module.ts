import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MarketingController } from './marketing.controller';
import { SmsModule } from './sms/sms.module';
import { EmailModule } from './email/email.module';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { QUEUE_MARKETING } from '../queue/queue.constants';

@Module({
  imports: [SmsModule, EmailModule, BullModule.registerQueue({ name: QUEUE_MARKETING })],
  controllers: [MarketingController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class MarketingModule {}
