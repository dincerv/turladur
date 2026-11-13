import { Module } from '@nestjs/common';

import { AgencyLinkModule } from '../../core/agency/agency-link.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { SearchQueryListener } from './listeners/search-query.listener';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [AgencyLinkModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, SearchQueryListener],
})
export class AnalyticsModule {}
