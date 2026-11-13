import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
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
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Role } from '@turta/shared-constants';

import {
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

  @Get('financials')
  @RequireStaffPermissions('reports')
  @ApiOperation({ summary: 'Monthly revenue for partner charts' })
  async financials(@CurrentUser() user: UserPayload) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getFinancials(agencyId);
  }

  @Get('reports')
  @RequireStaffPermissions('reports')
  @ApiOperation({ summary: 'Partner sales/performance/customer reports' })
  async reports(
    @CurrentUser() user: UserPayload,
    @Query('dateRange') dateRange?: string,
  ) {
    const allowed = [
      'today',
      'yesterday',
      'thisWeek',
      'lastWeek',
      'thisMonth',
      'lastMonth',
      'last3Months',
      'lastYear',
      'custom',
    ] as const;
    const range = allowed.includes(dateRange as (typeof allowed)[number])
      ? (dateRange as (typeof allowed)[number])
      : 'thisMonth';
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.getReports(agencyId, range);
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
  @Roles(
    Role.PARTNER,
    Role.AGENCY_OWNER,
    Role.AGENCY_ADMIN,
    ...PLATFORM_ADMIN_ROLES,
  )
  @ApiOperation({ summary: 'List sub-users for authenticated partner' })
  async users(@CurrentUser() user: UserPayload) {
    const agencyId = await this.sellerAgencyId(user);
    return this.partnerService.listSubUsers(agencyId);
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
