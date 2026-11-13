import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './core/auth/auth.module';
import { CacheModule } from './core/cache/cache.module';
import { PrismaModule } from './core/database/prisma.module';
import { HealthModule } from './core/health/health.module';
import { LoggerModule } from './core/logger/logger.module';
import { MailModule } from './core/mail/mail.module';
import { QueueModule } from './core/queue/queue.module';
import { RealtimeModule } from './core/realtime/realtime.module';
import { StorageModule } from './core/storage/storage.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from './modules/identity/identity.module';
import { BookingModule } from './modules/booking/booking.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PartnerModule } from './modules/partner/partner.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReviewModule } from './modules/review/review.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ContentModule } from './modules/content/content.module';
import { ContactModule } from './modules/contact/contact.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { ThrottlingModule } from './core/throttling/throttling.module';
import { AuditModule } from './core/audit/audit.module';
import { IdempotencyModule } from './core/idempotency/idempotency.module';
import { AgencyLinkModule } from './core/agency/agency-link.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Prefer apps/api/.env regardless of cwd (pnpm filter vs nest from package dir)
      envFilePath: ['apps/api/.env', '.env', '../../.env'],
    }),
    ThrottlingModule,
    EventEmitterModule.forRoot(),
    LoggerModule,
    PrismaModule,
    CacheModule,
    AuditModule,
    IdempotencyModule,
    AgencyLinkModule,
    AuthModule,
    StorageModule,
    MailModule,
    QueueModule,
    RealtimeModule,
    HealthModule,
    IdentityModule,
    CatalogModule,
    BookingModule,
    PaymentModule,
    PartnerModule,
    AdminModule,
    ReviewModule,
    NotificationModule,
    AnalyticsModule,
    ContentModule,
    ContactModule,
    PromotionModule,
  ],
})
export class AppModule {}
