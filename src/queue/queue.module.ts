import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SmsModule } from '../marketing/sms/sms.module';
import { EmailModule } from '../marketing/email/email.module';
import { FraudModule } from '../fraud/fraud.module';
import {
  QUEUE_ANALYTICS,
  QUEUE_COURIER,
  QUEUE_FRAUD,
  QUEUE_MARKETING,
  QUEUE_NOTIFICATIONS,
} from './queue.constants';
import { MarketingProcessor } from './processors/marketing.processor';
import { FraudProcessor } from './processors/fraud.processor';

@Global()
@Module({
  imports: [
    SmsModule,
    EmailModule,
    FraudModule,
    BullModule.registerQueue(
      { name: QUEUE_NOTIFICATIONS },
      { name: QUEUE_COURIER },
      { name: QUEUE_MARKETING },
      { name: QUEUE_FRAUD },
      { name: QUEUE_ANALYTICS },
    ),
  ],
  providers: [MarketingProcessor, FraudProcessor],
  exports: [BullModule],
})
export class QueueModule {}
