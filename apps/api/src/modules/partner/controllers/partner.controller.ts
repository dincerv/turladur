import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Role } from '@turta/shared-constants';

import {
  AGENCY_OWNER_ONLY_ROLES,
  AGENCY_REPORTS_MANAGER_ROLES,
  AGENCY_SELLER_ROLES,
  PLATFORM_ADMIN_ROLES,
} from '../../../core/auth/utils/role-access';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { RequireStaffPermissions } from '../../../core/auth/decorators/require-staff-permissions.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { PartnerService } from '../services/partner.service';

class UpdatePartnerReservationDto {
  @ApiPropertyOptional({
    enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'SUSPENDED'],
  })
  @IsOptional()
  @IsIn(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'SUSPENDED'])
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED';

  @ApiPropertyOptional({
    example: '14, 15',
    description: 'Partner-assigned seat numbers',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seatNumbers?: string;
}

class ListPartnerCustomersQueryDto {
  @ApiPropertyOptional({ description: 'Name / email / phone search' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

class ListPartnerReviewsQueryDto {
  @ApiPropertyOptional({ description: 'Comment / customer search' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ description: 'Star rating 1-5' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Owned tour or experience id' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tourId?: string;

  @ApiPropertyOptional({ enum: ['all', 'responded', 'pending'] })
  @IsOptional()
  @IsIn(['all', 'responded', 'pending'])
  responseStatus?: 'all' | 'responded' | 'pending';

  @ApiPropertyOptional({
    enum: ['newest', 'oldest', 'highest', 'lowest'],
  })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'highest', 'lowest'])
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

class ReplyPartnerReviewDto {
  @ApiProperty({
    example: 'Teşekkür ederiz, geri bildiriminiz bizim için değerli.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  reply!: string;
}

class ListPartnerReportsQueryDto {
  @ApiPropertyOptional({ enum: ['monthly', 'yearly'] })
  @IsOptional()
  @IsIn(['monthly', 'yearly'])
  period?: 'monthly' | 'yearly';

  @ApiPropertyOptional({
    enum: [
      'today',
      'yesterday',
      'thisWeek',
      'lastWeek',
      'thisMonth',
      'lastMonth',
      'last3Months',
      'lastYear',
      'thisYear',
      'custom',
    ],
  })
  @IsOptional()
  @IsIn([
    'today',
    'yesterday',
    'thisWeek',
    'lastWeek',
    'thisMonth',
    'lastMonth',
    'last3Months',
    'lastYear',
    'thisYear',
    'custom',
  ])
  dateRange?:
    | 'today'
    | 'yesterday'
    | 'thisWeek'
    | 'lastWeek'
    | 'thisMonth'
    | 'lastMonth'
    | 'last3Months'
    | 'lastYear'
    | 'thisYear'
    | 'custom';

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  endDate?: string;
}

class UpsertPartnerSalesGoalDto {
  @ApiProperty({ enum: ['monthly', 'yearly'] })
  @IsIn(['monthly', 'yearly'])
  period!: 'monthly' | 'yearly';

  @ApiProperty({
    enum: ['reservations', 'revenue', 'occupancy', 'completion'],
  })
  @IsIn(['reservations', 'revenue', 'occupancy', 'completion'])
  metric!: 'reservations' | 'revenue' | 'occupancy' | 'completion';

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  targetValue!: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  year!: number;

  @ApiPropertyOptional({ example: 11, description: 'monthly için 1-12' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

class ListPartnerFinancialsQueryDto {
  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  endDate?: string;

  @ApiPropertyOptional({
    enum: ['PAID', 'PENDING', 'OVERDUE', 'REFUNDED'],
  })
  @IsOptional()
  @IsIn(['PAID', 'PENDING', 'OVERDUE', 'REFUNDED'])
  status?: 'PAID' | 'PENDING' | 'OVERDUE' | 'REFUNDED';

  @ApiPropertyOptional({ description: 'Booking number / email search' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({ enum: ['csv', 'pdf'] })
  @IsOptional()
  @IsIn(['csv', 'pdf'])
  format?: 'csv' | 'pdf';
}

class ListPartnerReservationsQueryDto {
  @ApiPropertyOptional({ description: 'Customer / booking / tour search' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({
    enum: [
      'PENDING',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED',
      'SUSPENDED',
      'PENDING_PAYMENT',
      'PAYMENT_FAILED',
    ],
  })
  @IsOptional()
  @IsIn([
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'SUSPENDED',
    'PENDING_PAYMENT',
    'PAYMENT_FAILED',
  ])
  status?:
    | 'PENDING'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'SUSPENDED'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_FAILED';

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD (createdAt from)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD (createdAt to)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

class ListPartnerToursQueryDto {
  @ApiPropertyOptional({ description: 'Search title / category / slug' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({
    enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

class ListPartnerExperiencesQueryDto {
  @ApiPropertyOptional({ description: 'Search title / category / location' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({
    enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

  @ApiPropertyOptional({ description: 'Category contains filter' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

class UpdatePartnerProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string | null;
}

@ApiTags('Partner')
@ApiBearerAuth()
@Controller('partner')
@Roles(...AGENCY_SELLER_ROLES)
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  private async sellerAgencyId(user: UserPayload): Promise<string | undefined> {
    return this.agencyLink.resolveAgencyIdForActor({
      agencyId: user.agencyId,

      role: user.role,
    });
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Partner dashboard statistics' })
  async stats(@CurrentUser() user: UserPayload) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getDashboardStats(agencyId, {
      userId: user.userId,
      role: user.role,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated partner profile' })
  async me(@CurrentUser() user: UserPayload) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getProfile(agencyId);
  }

  @Patch('me')
  @Roles(
    Role.PARTNER,
    Role.AGENCY_OWNER,
    Role.AGENCY_ADMIN,
    ...PLATFORM_ADMIN_ROLES,
  )
  @ApiOperation({ summary: 'Update partner company profile' })
  async updateMe(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdatePartnerProfileDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.updateProfile(agencyId, dto);
  }

  @Get('financials/transactions')
  @RequireStaffPermissions('reports')
  @ApiOperation({
    summary: 'Paginated agency earnings ledger (tenant-scoped)',
  })
  async financialTransactions(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerFinancialsQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listFinancialTransactions(agencyId, query);
  }

  @Get('financials/export')
  @RequireStaffPermissions('reports')
  @ApiOperation({ summary: 'Export financial ledger as CSV (tenant-scoped)' })
  async financialExport(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerFinancialsQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.exportFinancials(agencyId, query);
  }

  @Get('financials')
  @RequireStaffPermissions('reports')
  @ApiOperation({
    summary: 'Financial KPIs + monthly revenue (AgencyEarning aggregates)',
  })
  async financials(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerFinancialsQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getFinancials(agencyId, {
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get('reports')
  @Roles(...AGENCY_REPORTS_MANAGER_ROLES)
  @ApiOperation({
    summary:
      'Agency analytics (OWNER/MANAGER only) — aggregates, occupancy, goals',
  })
  async reports(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerReportsQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getReports(agencyId, {
      dateRangeId: query.dateRange,
      period: query.period,
      startDate: query.startDate,
      endDate: query.endDate,
      role: user.role,
    });
  }

  @Put('reports/goals')
  @Roles(...AGENCY_REPORTS_MANAGER_ROLES)
  @ApiOperation({ summary: 'Upsert period sales goal (OWNER/MANAGER)' })
  async upsertReportGoal(
    @CurrentUser() user: UserPayload,
    @Body() body: UpsertPartnerSalesGoalDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.upsertSalesGoal(agencyId, user.role, body);
  }

  @Get('tours')
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary: 'List tours owned by partner (paginated, searchable)',
  })
  async tours(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerToursQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listTours(agencyId, {
      q: query.q,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('tours/:id')
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary: 'Get partner tour detail for editing (all statuses)',
  })
  async tourDetail(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getTourDetail(agencyId, id);
  }

  @Get('tours/:id/dates')
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary:
      'List owned tour dates (all statuses) — agency-scoped; not the public catalog endpoint',
  })
  async tourDates(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listOwnedTourDates(agencyId, id);
  }

  @Get('tours/:id/edit-bundle')
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary:
      'Edit bootstrap: tour + dates/ageRanges + pickups + accommodation (owned)',
  })
  async tourEditBundle(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getTourEditBundle(agencyId, id);
  }

  @Get('experiences')
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary: 'List experiences owned by partner (paginated, searchable)',
  })
  async experiences(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerExperiencesQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listExperiences(agencyId, {
      q: query.q,
      status: query.status,
      category: query.category,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('experiences/:id/edit-bundle')
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary: 'Edit bootstrap: owned experience + activity dates (all statuses)',
  })
  async experienceEditBundle(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getExperienceEditBundle(agencyId, id);
  }

  @Get('users')
  @Roles(...AGENCY_OWNER_ONLY_ROLES)
  @ApiOperation({ summary: 'List agency staff (OWNER only)' })
  async users(@CurrentUser() user: UserPayload) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listSubUsers(agencyId, user.role);
  }

  @Get('reviews')
  @RequireStaffPermissions('customers')
  @ApiOperation({
    summary: 'List agency reviews (tenant-scoped tours, filters, aggregates)',
  })
  async reviews(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerReviewsQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listReviews(agencyId, {
      q: query.q,
      rating: query.rating,
      tourId: query.tourId,
      responseStatus: query.responseStatus,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Patch('reviews/:reviewId/reply')
  @RequireStaffPermissions('customers')
  @ApiOperation({
    summary: 'Reply to a review (IDOR-safe tour ownership check)',
  })
  async replyToReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: ReplyPartnerReviewDto,
    @CurrentUser() user: UserPayload,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.replyToReview(
      agencyId,
      reviewId,
      { reply: dto.reply },
      user.role,
    );
  }

  @Get('customers')
  @RequireStaffPermissions('customers', 'reservations')
  @ApiOperation({
    summary: 'List agency customers (tenant-scoped, paginated, searchable)',
  })
  async customers(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerCustomersQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listCustomers(agencyId, {
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('customers/:customerKey')
  @RequireStaffPermissions('customers', 'reservations')
  @ApiOperation({
    summary: 'Customer detail — tour and payment history (IDOR-safe)',
  })
  async customerDetail(
    @Param('customerKey') customerKey: string,
    @CurrentUser() user: UserPayload,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getCustomerDetail(agencyId, customerKey);
  }

  @Get('reservations')
  @RequireStaffPermissions('reservations', 'customers')
  @ApiOperation({
    summary: 'List reservations for partner (paginated, filtered)',
  })
  async reservations(
    @CurrentUser() user: UserPayload,
    @Query() query: ListPartnerReservationsQueryDto,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listReservations(agencyId, {
      q: query.q,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Patch('reservations/:id')
  @RequireStaffPermissions('reservations')
  @ApiOperation({
    summary: 'Update partner reservation status and/or seat numbers',
  })
  async updateReservation(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerReservationDto,
    @CurrentUser() user: UserPayload,
  ) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.updateReservation(id, agencyId, {
      status: dto.status,
      seatNumbers: dto.seatNumbers,
    });
  }
}
