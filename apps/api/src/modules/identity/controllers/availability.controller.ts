import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@turta/shared-constants';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import {
  AvailabilityRangeQueryDto,
  ListGuidesForRangeQueryDto,
  ListVehiclesForRangeQueryDto,
  SetAvailabilityDayDto,
} from '../dto/availability.dto';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';
import { AvailabilityService } from '../services/availability.service';
import { VehicleService } from '../services/vehicle.service';

@ApiTags('Identity - Availability')
@ApiBearerAuth()
@Controller('identity')
export class AvailabilityController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly vehicles: VehicleService,
  ) {}

  @Get('guides/me/availability')
  @Roles(Role.GUIDE)
  @ApiOperation({ summary: 'Guide availability calendar range' })
  listGuide(
    @Query() query: AvailabilityRangeQueryDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.availability.listGuideDays(
      this.requireGuideId(user),
      query.from,
      query.to,
    );
  }

  @Put('guides/me/availability')
  @Roles(Role.GUIDE)
  @ApiOperation({ summary: 'Set guide availability for one day' })
  setGuide(
    @Body() dto: SetAvailabilityDayDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.availability.setGuideDay(
      this.requireGuideId(user),
      dto.date,
      dto.isAvailable,
    );
  }

  @Get('guides')
  @Roles(
    Role.PARTNER,
    Role.PARTNER_STAFF,
    Role.AGENCY_OWNER,
    Role.AGENCY_ADMIN,
    Role.AGENCY_STAFF,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({
    summary:
      'Agency: list VERIFIED guides with availability for a date range (tour sefer)',
  })
  listGuides(@Query() query: ListGuidesForRangeQueryDto) {
    return this.availability.listGuidesForRange(query.from, query.to, {
      q: query.q,
      availableOnly: query.availableOnly,
    });
  }

  @Get('guides/:guideId/availability')
  @Roles(
    Role.PARTNER,
    Role.PARTNER_STAFF,
    Role.AGENCY_OWNER,
    Role.AGENCY_ADMIN,
    Role.AGENCY_STAFF,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Agency: read a guide availability calendar range' })
  listGuideById(
    @Param('guideId') guideId: string,
    @Query() query: AvailabilityRangeQueryDto,
  ) {
    return this.availability.listGuideDays(guideId, query.from, query.to);
  }

  @Get('vehicles')
  @Roles(
    Role.PARTNER,
    Role.PARTNER_STAFF,
    Role.AGENCY_OWNER,
    Role.AGENCY_ADMIN,
    Role.AGENCY_STAFF,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({
    summary:
      'Agency: list active vehicles (VERIFIED bus companies) with availability for a date range',
  })
  listAgencyVehicles(@Query() query: ListVehiclesForRangeQueryDto) {
    return this.availability.listVehiclesForRange(query.from, query.to, {
      kind: query.kind,
      q: query.q,
      availableOnly: query.availableOnly,
    });
  }

  @Get('bus-companies/me/vehicles')
  @Roles(Role.BUS_COMPANY)
  @ApiOperation({ summary: 'List vehicles for logged-in bus company' })
  listVehicles(@CurrentUser() user: UserPayload) {
    return this.vehicles.list(this.requireBusCompanyId(user));
  }

  @Post('bus-companies/me/vehicles')
  @Roles(Role.BUS_COMPANY)
  @ApiOperation({ summary: 'Register a vehicle (plate + seatLayoutKind)' })
  createVehicle(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.vehicles.create(this.requireBusCompanyId(user), dto);
  }

  @Patch('bus-companies/me/vehicles/:vehicleId')
  @Roles(Role.BUS_COMPANY)
  @ApiOperation({ summary: 'Update own vehicle' })
  updateVehicle(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.vehicles.update(this.requireBusCompanyId(user), vehicleId, dto);
  }

  @Delete('bus-companies/me/vehicles/:vehicleId')
  @Roles(Role.BUS_COMPANY)
  @ApiOperation({ summary: 'Soft-delete own vehicle' })
  deleteVehicle(
    @Param('vehicleId') vehicleId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.vehicles.softDelete(
      this.requireBusCompanyId(user),
      vehicleId,
      user.userId,
    );
  }

  @Get('bus-companies/me/vehicles/:vehicleId/availability')
  @Roles(Role.BUS_COMPANY)
  @ApiOperation({ summary: 'Vehicle availability calendar range' })
  listVehicle(
    @Param('vehicleId') vehicleId: string,
    @Query() query: AvailabilityRangeQueryDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.availability.listVehicleDays(
      this.requireBusCompanyId(user),
      vehicleId,
      query.from,
      query.to,
    );
  }

  @Put('bus-companies/me/vehicles/:vehicleId/availability')
  @Roles(Role.BUS_COMPANY)
  @ApiOperation({ summary: 'Set vehicle availability for one day' })
  setVehicle(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: SetAvailabilityDayDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.availability.setVehicleDay(
      this.requireBusCompanyId(user),
      vehicleId,
      dto.date,
      dto.isAvailable,
    );
  }

  private requireGuideId(user: UserPayload): string {
    if (!user.guideId) {
      throw new BusinessException('GUIDE_REQUIRED', 'Rehber oturumu gerekli');
    }
    return user.guideId;
  }

  private requireBusCompanyId(user: UserPayload): string {
    const busCompanyId = user.busCompanyId;
    if (!busCompanyId) {
      throw new BusinessException(
        'BUS_COMPANY_REQUIRED',
        'Otobüs firması oturumu gerekli',
      );
    }
    return busCompanyId;
  }
}
