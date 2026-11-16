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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@turta/shared-constants';

import { AGENCY_SELLER_ROLES } from '../../../core/auth/utils/role-access';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ListReviewsQueryDto } from '../dto/list-reviews-query.dto';
import { PersonaMatchDto } from '../dto/persona-match.dto';
import { ReplyReviewDto } from '../dto/reply-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewService } from '../services/review.service';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Public()
  @Get('tours/:tourId')
  @ApiOperation({ summary: 'List reviews for a tour' })
  listByTour(
    @Param('tourId') tourId: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    return this.reviewService.listByTour(tourId, query);
  }

  @Public()
  @Post('tours/:tourId/persona-match')
  @ApiOperation({
    summary: 'Persona-based review matching — fit score and customized summary',
  })
  matchPersona(@Param('tourId') tourId: string, @Body() dto: PersonaMatchDto) {
    return this.reviewService.matchPersona(tourId, dto);
  }

  @ApiBearerAuth()
  @Get('partner')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({ summary: 'List reviews for authenticated partner' })
  listForPartner(@CurrentUser() user: UserPayload) {
    return this.reviewService.listForPartner(user.agencyId);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'My reviews' })
  listMine(@CurrentUser() user: UserPayload) {
    return this.reviewService.listMine(user.userId);
  }

  @ApiBearerAuth()
  @Get('eligible/:tourId')
  @ApiOperation({
    summary: 'Eligible COMPLETED reservation for reviewing this tour',
  })
  eligible(@Param('tourId') tourId: string, @CurrentUser() user: UserPayload) {
    return this.reviewService.getEligibleReservation(tourId, user.userId);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create review (COMPLETED booking only)' })
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: UserPayload) {
    return this.reviewService.create(dto, user.userId);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update own review' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.reviewService.update(id, dto, user.userId);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete review' })
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.reviewService.softDelete(id, user.userId, user.role);
  }

  @ApiBearerAuth()
  @Patch(':id/reply')
  @Roles(...AGENCY_SELLER_ROLES)
  @ApiOperation({ summary: 'Partner reply to a review' })
  reply(
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.reviewService.reply(id, dto, user.agencyId, user.role);
  }
}
