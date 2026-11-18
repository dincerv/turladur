import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@turta/shared-constants';

import {
  AGENCY_SELLER_ROLES,
  PLATFORM_ADMIN_ROLES,
  resolveActorId,
} from '../../../core/auth/utils/role-access';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import {
  InviteBusAssignmentDto,
  InviteGuideAssignmentDto,
  RespondAssignmentDto,
} from '../dto/tour-date-assignment.dto';
import { TourDateAssignmentService } from '../services/tour-date-assignment.service';

@ApiTags('Catalog - Tour Date Assignments')
@ApiBearerAuth()
@Controller('catalog')
export class TourDateAssignmentController {
  constructor(private readonly assignmentService: TourDateAssignmentService) {}

  @Get('guides/me/assignments')
  @Roles(Role.GUIDE)
  @ApiOperation({ summary: 'Guide inbox — PENDING/ACCEPTED assignments' })
  listMine(@CurrentUser() user: UserPayload) {
    return this.assignmentService.listForGuide(this.requireGuideId(user));
  }

  @Get('bus-companies/me/assignments')
  @Roles(Role.BUS_COMPANY)
  @ApiOperation({
    summary: 'Bus company inbox — PENDING/ACCEPTED assignments',
  })
  listBusMine(@CurrentUser() user: UserPayload) {
    return this.assignmentService.listForBusCompany(
      this.requireBusCompanyId(user),
    );
  }

  @Get('agencies/me/assignments')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({
    summary: 'Agency global inbox — GUIDE/BUS assignments for this agency',
  })
  listAgencyMine(@CurrentUser() user: UserPayload) {
    return this.assignmentService.listForAgency(user.agencyId, user.role);
  }

  @Get('tour-dates/:tourDateId/assignments')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({ summary: 'List assignments for a tour date' })
  list(
    @Param('tourDateId') tourDateId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.assignmentService.listByTourDate(
      tourDateId,
      user.agencyId,
      user.role,
    );
  }

  @Post('tour-dates/:tourDateId/assignments/guide')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({ summary: 'Invite guide (PENDING)' })
  inviteGuide(
    @Param('tourDateId') tourDateId: string,
    @Body() dto: InviteGuideAssignmentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.assignmentService.inviteGuide(
      tourDateId,
      dto,
      user.agencyId,
      user.role,
    );
  }

  @Post('tour-dates/:tourDateId/assignments/bus')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({ summary: 'Invite bus company (PENDING)' })
  inviteBus(
    @Param('tourDateId') tourDateId: string,
    @Body() dto: InviteBusAssignmentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.assignmentService.inviteBus(
      tourDateId,
      dto,
      user.agencyId,
      user.role,
    );
  }

  @Patch('assignments/:assignmentId/respond')
  @Roles(Role.GUIDE, Role.BUS_COMPANY, ...PLATFORM_ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Accept/reject assignment (ACCEPTED → multi-day availability block + TourDate mirror)',
  })
  respond(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: RespondAssignmentDto,
    @CurrentUser() user: UserPayload,
  ) {
    // Never trust body actor* — JWT claim only (IDOR).
    const actorGuideId =
      user.role === Role.GUIDE ? this.requireGuideId(user) : undefined;
    const actorBusCompanyId =
      user.role === Role.BUS_COMPANY
        ? this.requireBusCompanyId(user)
        : undefined;
    return this.assignmentService.respond(
      assignmentId,
      {
        ...dto,
        actorGuideId,
        actorBusCompanyId,
      },
      user.agencyId,
      user.role,
    );
  }

  @Patch('assignments/:assignmentId/withdraw')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({ summary: 'Withdraw PENDING invite' })
  withdraw(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.assignmentService.withdrawPending(
      assignmentId,
      user.agencyId,
      user.role,
      resolveActorId(user),
    );
  }

  @Patch('assignments/:assignmentId/cancel')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({
    summary: 'Cancel ACCEPTED assignment — reopen availability + clear mirror',
  })
  cancel(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.assignmentService.cancelAccepted(
      assignmentId,
      user.agencyId,
      user.role,
      resolveActorId(user),
    );
  }

  private requireGuideId(user: UserPayload): string {
    if (!user.guideId) {
      throw new ForbiddenException({
        code: 'GUIDE_REQUIRED',
        message: 'Rehber oturumu gerekli',
      });
    }
    return user.guideId;
  }

  private requireBusCompanyId(user: UserPayload): string {
    if (!user.busCompanyId) {
      throw new ForbiddenException({
        code: 'BUS_COMPANY_REQUIRED',
        message: 'Otobüs firması oturumu gerekli',
      });
    }
    return user.busCompanyId;
  }
}
