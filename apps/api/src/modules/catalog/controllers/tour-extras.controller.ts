import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AGENCY_SELLER_ROLES,
  resolveActorId,
} from '../../../core/auth/utils/role-access';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { RequireStaffPermissions } from '../../../core/auth/decorators/require-staff-permissions.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import {
  CreatePaidTourExtraDto,
  CreateTourPickupPointDto,
  UpdatePaidTourExtraDto,
  UpdateTourPickupPointDto,
  UpsertTourAccommodationDto,
} from '../dto/tour-extras.dto';
import { TourExtrasService } from '../services/tour-extras.service';

@ApiTags('Catalog - Tour Extras')
@Controller('catalog/tours/:tourId')
export class TourExtrasController {
  constructor(private readonly tourExtrasService: TourExtrasService) {}

  @Public()
  @Get('accommodation')
  @ApiOperation({ summary: 'Get tour accommodation summary' })
  getAccommodation(@Param('tourId') tourId: string) {
    return this.tourExtrasService.getAccommodation(tourId);
  }

  @Put('accommodation')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Create or update tour accommodation (1:1)' })
  upsertAccommodation(
    @Param('tourId') tourId: string,
    @Body() dto: UpsertTourAccommodationDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.upsertAccommodation(
      tourId,
      dto,
      user.agencyId,
      user.role,
    );
  }

  @Delete('accommodation')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Soft-delete tour accommodation' })
  deleteAccommodation(
    @Param('tourId') tourId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.deleteAccommodation(
      tourId,
      user.agencyId,
      user.role,
      resolveActorId(user),
    );
  }

  @Public()
  @Get('pickup-points')
  @ApiOperation({ summary: 'List active pickup points' })
  listPickupPoints(@Param('tourId') tourId: string) {
    return this.tourExtrasService.listPickupPoints(tourId);
  }

  @Post('pickup-points')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Add pickup point' })
  createPickupPoint(
    @Param('tourId') tourId: string,
    @Body() dto: CreateTourPickupPointDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.createPickupPoint(
      tourId,
      dto,
      user.agencyId,
      user.role,
    );
  }

  @Patch('pickup-points/:pointId')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Update pickup point' })
  updatePickupPoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @Body() dto: UpdateTourPickupPointDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.updatePickupPoint(
      tourId,
      pointId,
      dto,
      user.agencyId,
      user.role,
    );
  }

  @Delete('pickup-points/:pointId')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Soft-delete pickup point' })
  deletePickupPoint(
    @Param('tourId') tourId: string,
    @Param('pointId') pointId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.deletePickupPoint(
      tourId,
      pointId,
      user.agencyId,
      user.role,
      resolveActorId(user),
    );
  }

  @Public()
  @Get('extras')
  @ApiOperation({ summary: 'List active paid tour extras (checkout)' })
  listPaidExtrasPublic(@Param('tourId') tourId: string) {
    return this.tourExtrasService.listPaidExtras(tourId, false);
  }

  @Get('extras/manage')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Agency list paid extras (incl. inactive)' })
  listPaidExtrasManage(
    @Param('tourId') tourId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.listPaidExtrasForAgency(
      tourId,
      user.agencyId,
      user.role,
    );
  }

  @Post('extras')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Create paid tour extra' })
  createPaidExtra(
    @Param('tourId') tourId: string,
    @Body() dto: CreatePaidTourExtraDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.createPaidExtra(
      tourId,
      dto,
      user.agencyId,
      user.role,
    );
  }

  @Patch('extras/:extraId')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Update paid tour extra' })
  updatePaidExtra(
    @Param('tourId') tourId: string,
    @Param('extraId') extraId: string,
    @Body() dto: UpdatePaidTourExtraDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.updatePaidExtra(
      tourId,
      extraId,
      dto,
      user.agencyId,
      user.role,
    );
  }

  @Delete('extras/:extraId')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Soft-delete paid tour extra' })
  deletePaidExtra(
    @Param('tourId') tourId: string,
    @Param('extraId') extraId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourExtrasService.softDeletePaidExtra(
      tourId,
      extraId,
      user.agencyId,
      user.role,
      resolveActorId(user),
    );
  }
}
