import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SmsService } from '../../marketing/sms/sms.service';
import { EmailService } from '../../marketing/email/email.service';
import {
  JOB_BULK_EMAIL,
  JOB_BULK_SMS,
  QUEUE_MARKETING,
} from '../queue.constants';

@Processor(QUEUE_MARKETING)
export class MarketingProcessor extends WorkerHost {
  private readonly logger = new Logger(MarketingProcessor.name);

  constructor(
    private readonly sms: SmsService,
    private readonly email: EmailService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_BULK_SMS: {
        const { phones, message } = job.data as { phones: string[]; message: string };
        const results = await this.sms.sendBulk(phones, message);
        return { sent: results.filter((r) => r.success).length, total: phones.length };
      }
      case JOB_BULK_EMAIL: {
        const { recipients, subject, html } = job.data as {
          recipients: string[];
          subject: string;
          html: string;
        };
        const results = await this.email.sendBulk(recipients, subject, html);
        return { sent: results.filter((r) => r.success).length, total: recipients.length };
      }
      default:
        this.logger.warn(`Unknown marketing job: ${job.name}`);
        return {};
    }
  }
}
