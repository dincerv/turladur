import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Role } from '@turta/shared-constants';

import {
  AGENCY_SELLER_ROLES,
  PLATFORM_ADMIN_ROLES,
} from '../../../core/auth/utils/role-access';

import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { AnalyticsService } from '../services/analytics.service';

class PopularSearchesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  @Get('admin/overview')
  @Roles(...PLATFORM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Platform metrics for admin dashboard' })
  adminOverview() {
    return this.analyticsService.getAdminOverview();
  }

  @Get('admin/popular-searches')
  @Roles(...PLATFORM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Top search queries (last 30 days)' })
  popularSearches(@Query() query: PopularSearchesQueryDto) {
    return this.analyticsService.getPopularSearches(query.limit ?? 10);
  }

  @Get('admin/recent-searches')
  @Roles(...PLATFORM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Recent SearchQueryLog rows' })
  recentSearches(@Query() query: PopularSearchesQueryDto) {
    return this.analyticsService.listRecentSearches(query.limit ?? 50);
  }

  @Get('partner/overview')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({ summary: 'Partner dashboard metrics' })
  async partnerOverview(@CurrentUser() user: UserPayload) {
    const agencyId = await this.agencyLink.resolveAgencyIdForActor({
      agencyId: user.agencyId,
      role: user.role,
    });
    return this.analyticsService.getPartnerOverview(agencyId);
  }
}
