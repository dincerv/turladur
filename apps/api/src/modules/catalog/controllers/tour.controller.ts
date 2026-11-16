import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AGENCY_SELLER_ROLES,
  resolveActorId,
} from '../../../core/auth/utils/role-access';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { RequireStaffPermissions } from '../../../core/auth/decorators/require-staff-permissions.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { CreateTourDateCommand } from '../commands/create-tour-date/create-tour-date.command';
import { CreateTourCommand } from '../commands/create-tour/create-tour.command';
import { DeleteTourCommand } from '../commands/delete-tour/delete-tour.command';
import { UpdateTourCommand } from '../commands/update-tour/update-tour.command';
import { CancelTourDatesDto } from '../dto/cancel-tour-dates.dto';
import { CancelTourDto } from '../dto/cancel-tour.dto';
import { AiSearchToursDto } from '../dto/ai-search-tours.dto';
import { CompareToursDto } from '../dto/compare-tours.dto';
import { CreateTourDateDto } from '../dto/create-tour-date.dto';
import { CreateTourDto } from '../dto/create-tour.dto';
import { SearchToursDto } from '../dto/search-tours.dto';
import { UpdateTourDto } from '../dto/update-tour.dto';
import { GetTourQuery } from '../queries/get-tour/get-tour.query';
import { ListTourDatesQuery } from '../queries/list-tour-dates/list-tour-dates.query';
import { SearchToursQuery } from '../queries/search-tours/search-tours.query';
import { TourService } from '../services/tour.service';

@ApiTags('Catalog - Tours')
@Controller('catalog/tours')
export class TourController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tourService: TourService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('search')
  @ApiOperation({ summary: 'Search published tours (Redis cached)' })
  search(@Query() dto: SearchToursDto) {
    return this.queryBus.execute(new SearchToursQuery(dto));
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('compare')
  @ApiOperation({
    summary: 'Compare up to 4 tours in one query (normalized matrix DTO)',
  })
  compare(@Body() dto: CompareToursDto) {
    return this.tourService.compareTours(dto);
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('ai-search')
  @ApiOperation({
    summary:
      'Conversational tour search (NL → filters → catalog; heuristic parser)',
  })
  aiSearch(@Body() dto: AiSearchToursDto) {
    return this.tourService.aiSearch(dto);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Related tours by shared tags (RelatedTours)' })
  listRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 6;
    return this.tourService.listRelatedTours(
      id,
      Number.isFinite(parsed) ? parsed : 6,
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get tour detail by id' })
  getById(@Param('id') id: string) {
    return this.queryBus.execute(new GetTourQuery(id));
  }

  @Public()
  @Get(':id/dates')
  @ApiOperation({ summary: 'List active tour dates' })
  listDates(@Param('id') id: string) {
    return this.queryBus.execute(new ListTourDatesQuery(id));
  }

  @Post()
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Create a tour (verified partner)' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateTourDto, @CurrentUser() user: UserPayload) {
    return this.commandBus.execute(new CreateTourCommand(dto, user.agencyId));
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Update owned tour' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTourDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commandBus.execute(
      new UpdateTourCommand(id, dto, user.agencyId, user.role),
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Soft-delete owned tour' })
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.commandBus.execute(
      new DeleteTourCommand(id, user.agencyId, user.role, resolveActorId(user)),
    );
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary:
      'Cancel / delist tour with reason — cancels active bookings and emails guests',
  })
  cancelTour(
    @Param('id') id: string,
    @Body() dto: CancelTourDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourService.cancelWithReason(
      id,
      user.agencyId,
      user.role,
      dto.reason,
      dto.note,
    );
  }

  @Post(':id/dates/cancel')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({
    summary:
      'Cancel selected tour dates — cancels bookings for those dates and emails guests',
  })
  cancelTourDates(
    @Param('id') id: string,
    @Body() dto: CancelTourDatesDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tourService.cancelDates(
      id,
      user.agencyId,
      user.role,
      dto.dateIds,
      dto.reason,
      dto.note,
    );
  }

  @Post(':id/dates')
  @ApiBearerAuth()
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('tours')
  @ApiOperation({ summary: 'Add a date/capacity window to a tour' })
  createDate(
    @Param('id') id: string,
    @Body() dto: CreateTourDateDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commandBus.execute(
      new CreateTourDateCommand(id, dto, user.agencyId, user.role),
    );
  }
}
