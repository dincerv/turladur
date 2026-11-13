import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AGENCY_SELLER_ROLES,
  resolveActorId,
} from '../../../core/auth/utils/role-access';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { RequireStaffPermissions } from '../../../core/auth/decorators/require-staff-permissions.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import {
  AssignSeatBulkDto,
  AssignSeatManualDto,
  SeatMapQueryDto,
} from '../dto/seat-assignment.dto';
import { SeatAssignmentService } from '../services/seat-assignment.service';

@ApiTags('Booking - Seat Assignments')
@ApiBearerAuth()
@Controller('booking')
export class SeatAssignmentController {
  constructor(private readonly seatAssignmentService: SeatAssignmentService) {}

  @Get('tour-dates/:tourDateId/seats')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('reservations')
  @ApiOperation({ summary: 'Seat map + occupancy + unassigned guests' })
  getMap(
    @Param('tourDateId') tourDateId: string,
    @Query() query: SeatMapQueryDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.seatAssignmentService.getSeatMap(
      tourDateId,
      user.agencyId,
      user.role,
      query.tourId,
    );
  }

  @Post('tour-dates/:tourDateId/seats/assign')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('reservations')
  @ApiOperation({ summary: 'MANUAL seat assign (confirmed guest only)' })
  assign(
    @Param('tourDateId') tourDateId: string,
    @Body() dto: AssignSeatManualDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.seatAssignmentService.assignManual(
      tourDateId,
      dto,
      user.agencyId,
      user.role,
      dto.tourId,
    );
  }

  @Post('tour-dates/:tourDateId/seats/assign-bulk')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('reservations')
  @ApiOperation({
    summary: 'MANUAL bulk seat assign in one Serializable transaction',
  })
  assignBulk(
    @Param('tourDateId') tourDateId: string,
    @Body() dto: AssignSeatBulkDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.seatAssignmentService.assignManualBulk(
      tourDateId,
      dto.assignments,
      user.agencyId,
      user.role,
      dto.tourId,
    );
  }

  @Post('tour-dates/:tourDateId/seats/auto-fifo')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('reservations')
  @ApiOperation({ summary: 'AUTO_FIFO fill free seats by booking order' })
  autoFifo(
    @Param('tourDateId') tourDateId: string,
    @Body() body: { tourId?: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.seatAssignmentService.autoFifo(
      tourDateId,
      user.agencyId,
      user.role,
      body?.tourId,
    );
  }

  @Delete('seat-assignments/:assignmentId')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('reservations')
  @ApiOperation({ summary: 'Unassign seat (soft-delete)' })
  unassign(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.seatAssignmentService.unassign(
      assignmentId,
      user.agencyId,
      user.role,
      resolveActorId(user),
    );
  }
}
