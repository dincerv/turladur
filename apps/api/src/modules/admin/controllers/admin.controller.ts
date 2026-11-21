import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Role } from '@turta/shared-constants';

import { PLATFORM_ADMIN_ROLES } from '../../../core/auth/utils/role-access';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { SetAgencyStatusDto } from '../../identity/dto/agency.dto';
import { AdminService } from '../services/admin.service';

class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;
}

class UpdatePartnerStatusDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'SUSPENDED'] })
  @IsIn(['VERIFIED', 'REJECTED', 'SUSPENDED'])
  status!: 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

  @ApiPropertyOptional({
    description: 'Red / askı gerekçesi (REJECTED ve SUSPENDED için zorunlu)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class UpdateTourStatusDto {
  @ApiProperty({ enum: ['PUBLISHED', 'ARCHIVED', 'DRAFT'] })
  @IsIn(['PUBLISHED', 'ARCHIVED', 'DRAFT'])
  status!: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT';

  @ApiPropertyOptional({ description: 'Red / taslak gerekçesi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class UpdateExperienceStatusDto {
  @ApiProperty({ enum: ['PUBLISHED', 'ARCHIVED', 'DRAFT'] })
  @IsIn(['PUBLISHED', 'ARCHIVED', 'DRAFT'])
  status!: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT';

  @ApiPropertyOptional({ description: 'Red / taslak gerekçesi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(...PLATFORM_ADMIN_ROLES)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private actorOf(user: UserPayload) {
    return { userId: user.userId };
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Platform-wide admin statistics' })
  stats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  users() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role or active flag' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.updateUser(id, dto, this.actorOf(user));
  }

  @Get('partners')
  @ApiOperation({ summary: 'List partners (optional status filter)' })
  partners(@Query('status') status?: string) {
    return this.adminService.listPartners(status);
  }

  @Patch('partners/:id/status')
  @ApiOperation({ summary: 'Approve / reject / suspend partner' })
  partnerStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerStatusDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.setPartnerStatus(
      id,
      dto.status,
      dto.note,
      this.actorOf(user),
    );
  }

  @Get('guides')
  @ApiOperation({ summary: 'List guides (optional status filter)' })
  guides(@Query('status') status?: string) {
    return this.adminService.listGuides(status);
  }

  @Patch('guides/:id/status')
  @ApiOperation({ summary: 'Approve / reject / suspend guide' })
  guideStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerStatusDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.setGuideStatus(
      id,
      dto.status,
      dto.note,
      this.actorOf(user),
    );
  }

  @Get('tours/pending')
  @ApiOperation({ summary: 'Tours awaiting review' })
  pendingTours() {
    return this.adminService.listPendingTours();
  }

  @Get('tours/:id')
  @ApiOperation({
    summary: 'Tour moderation preview (any status; not public catalog)',
  })
  tourPreview(@Param('id') id: string) {
    return this.adminService.getTourPreview(id);
  }

  @Patch('tours/:id/status')
  @ApiOperation({ summary: 'Publish / archive / draft a tour' })
  tourStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTourStatusDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.setTourStatus(
      id,
      dto.status,
      dto.note,
      this.actorOf(user),
    );
  }

  @Get('experiences/pending')
  @ApiOperation({ summary: 'Experiences awaiting review' })
  pendingExperiences() {
    return this.adminService.listPendingExperiences();
  }

  @Patch('experiences/:id/status')
  @ApiOperation({ summary: 'Publish / archive / draft an experience' })
  experienceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExperienceStatusDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.setExperienceStatus(
      id,
      dto.status,
      dto.note,
      this.actorOf(user),
    );
  }

  @Get('agencies')
  @ApiOperation({ summary: 'List agencies (optional status filter)' })
  agencies(@Query('status') status?: string) {
    return this.adminService.listAgencies(status);
  }

  @Patch('agencies/:id/approve')
  @ApiOperation({ summary: 'Approve agency (shortcut → VERIFIED)' })
  approveAgency(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.adminService.setAgencyStatus(
      id,
      'VERIFIED',
      undefined,
      this.actorOf(user),
    );
  }

  @Patch('agencies/:id/status')
  @ApiOperation({ summary: 'Verify / reject / suspend agency' })
  agencyStatus(
    @Param('id') id: string,
    @Body() dto: SetAgencyStatusDto,
    @CurrentUser() user: UserPayload,
  ) {
    const status = dto.status === 'APPROVED' ? 'VERIFIED' : dto.status;
    return this.adminService.setAgencyStatus(
      id,
      status,
      dto.note,
      this.actorOf(user),
    );
  }

  @Get('reservations')
  @ApiOperation({ summary: 'List platform reservations' })
  reservations(@Query('status') status?: string, @Query('q') q?: string) {
    return this.adminService.listReservations({ status, q });
  }

  @Get('reviews/tours')
  @ApiOperation({ summary: 'Tour-grouped review moderation summary' })
  reviewTours(@Query('q') q?: string) {
    return this.adminService.listReviewTours(q);
  }

  @Get('reviews/tours/:tourId')
  @ApiOperation({ summary: 'Reviews for a single tour' })
  tourReviews(
    @Param('tourId') tourId: string,
    @Query('includeHidden') includeHidden?: string,
  ) {
    return this.adminService.listTourReviews(tourId, {
      includeHidden:
        includeHidden === '1' ||
        includeHidden === 'true' ||
        includeHidden === 'yes',
    });
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List recent reviews for moderation (legacy flat)' })
  reviews(@Query('q') q?: string) {
    return this.adminService.listReviews(q);
  }

  @Patch('reviews/:id/hide')
  @ApiOperation({ summary: 'Hide (soft-delete) a review' })
  hideReview(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.adminService.hideReview(id, this.actorOf(user));
  }

  @Patch('reviews/:id/restore')
  @ApiOperation({ summary: 'Restore a hidden review' })
  restoreReview(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.adminService.restoreReview(id, this.actorOf(user));
  }

  @Get('audit-logs/entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Audit timeline for a single entity' })
  entityAudit(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.adminService.listEntityAudit(entityType, entityId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Platform admin audit log (filterable)' })
  auditLogs(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('take') take?: string,
  ) {
    const takeNum = take ? Number(take) : undefined;
    return this.adminService.listAuditLogs({
      actorId,
      action,
      entityType,
      entityId,
      from,
      to,
      take: Number.isFinite(takeNum) ? takeNum : undefined,
    });
  }
}
