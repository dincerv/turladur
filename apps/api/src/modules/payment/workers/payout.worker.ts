import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaService } from '../../../core/database/prisma.service';
import { AgencyEarningService } from '../services/agency-earning.service';

/** PENDING payout’ları BankInfo varsa PAID işaretle (mock settlement). */
const PAYOUT_SWEEP_INTERVAL_MS = 60_000;

@Injectable()
export class PayoutWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PayoutWorker.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly earningService: AgencyEarningService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.tick();
    }, PAYOUT_SWEEP_INTERVAL_MS);
    this.logger.log('PayoutWorker started (60s interval)');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      const pending = await this.prisma.agencyPayout.findMany({
        where: { status: 'PENDING', deletedAt: null },
        take: 20,
        orderBy: { createdAt: 'asc' },
      });

      for (const payout of pending) {
        const bank = await this.prisma.agencyBankInfo.findFirst({
          where: { agencyId: payout.agencyId, deletedAt: null },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });
        if (!bank) continue;

        await this.earningService.markPayoutPaid(payout.id);
        this.logger.log(`Payout ${payout.id} marked PAID`);
      }
    } catch (error) {
      this.logger.error(
        `PayoutWorker tick failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
