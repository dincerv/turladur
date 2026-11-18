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

import { Roles } from '../../../core/auth/decorators/roles.decorator';
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
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Get('partners')
  @ApiOperation({ summary: 'List partners (optional status filter)' })
  partners(@Query('status') status?: string) {
    return this.adminService.listPartners(status);
  }

  @Patch('partners/:id/status')
  @ApiOperation({ summary: 'Approve / reject / suspend partner' })
  partnerStatus(@Param('id') id: string, @Body() dto: UpdatePartnerStatusDto) {
    return this.adminService.setPartnerStatus(id, dto.status);
  }

  @Get('guides')
  @ApiOperation({ summary: 'List guides (optional status filter)' })
  guides(@Query('status') status?: string) {
    return this.adminService.listGuides(status);
  }

  @Patch('guides/:id/status')
  @ApiOperation({ summary: 'Approve / reject / suspend guide' })
  guideStatus(@Param('id') id: string, @Body() dto: UpdatePartnerStatusDto) {
    return this.adminService.setGuideStatus(id, dto.status);
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
  tourStatus(@Param('id') id: string, @Body() dto: UpdateTourStatusDto) {
    return this.adminService.setTourStatus(id, dto.status, dto.note);
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
  ) {
    return this.adminService.setExperienceStatus(id, dto.status, dto.note);
  }

  @Get('agencies')
  @ApiOperation({ summary: 'List agencies (optional status filter)' })
  agencies(@Query('status') status?: string) {
    return this.adminService.listAgencies(status);
  }

  @Patch('agencies/:id/approve')
  @ApiOperation({ summary: 'Approve agency (shortcut → VERIFIED)' })
  approveAgency(@Param('id') id: string) {
    return this.adminService.setAgencyStatus(id, 'VERIFIED');
  }

  @Patch('agencies/:id/status')
  @ApiOperation({ summary: 'Verify / reject / suspend agency' })
  agencyStatus(@Param('id') id: string, @Body() dto: SetAgencyStatusDto) {
    const status = dto.status === 'APPROVED' ? 'VERIFIED' : dto.status;
    return this.adminService.setAgencyStatus(id, status);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'List platform reservations' })
  reservations() {
    return this.adminService.listReservations();
  }
}
