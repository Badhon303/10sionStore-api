import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudService } from '../../fraud/fraud.service';
import { JOB_RESCORE_CUSTOMERS, QUEUE_FRAUD } from '../queue.constants';

@Processor(QUEUE_FRAUD)
export class FraudProcessor extends WorkerHost {
  private readonly logger = new Logger(FraudProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fraud: FraudService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    if (job.name !== JOB_RESCORE_CUSTOMERS) return {};
    const customers = await this.prisma.customer.findMany({
      select: { storeId: true, phone: true },
      take: 5000,
    });
    let rescored = 0;
    for (const c of customers) {
      await this.fraud.score(c.storeId, c.phone).catch(() => null);
      rescored++;
    }
    this.logger.log(`Re-scored ${rescored} customers`);
    return { rescored };
  }
}
