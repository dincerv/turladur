import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { RequireStaffPermissions } from '../../../core/auth/decorators/require-staff-permissions.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import {
  AGENCY_SELLER_ROLES,
  PLATFORM_ADMIN_ROLES,
} from '../../../core/auth/utils/role-access';
import { UserPayload } from '../../../core/auth/types/auth.types';
import {
  CreatePayoutDto,
  UpsertAgencyBankInfoDto,
  UpsertCommissionRateDto,
} from '../dto/agency-finance.dto';
import {
  AgencyBankInfoService,
  AgencyCommissionService,
} from '../services/agency-commission.service';
import { AgencyEarningService } from '../services/agency-earning.service';

@ApiTags('Payment - Agency Finance')
@ApiBearerAuth()
@Controller('payment/agencies')
export class AgencyFinanceController {
  constructor(
    private readonly earningService: AgencyEarningService,
    private readonly commissionService: AgencyCommissionService,
    private readonly bankInfoService: AgencyBankInfoService,
  ) {}

  @Get(':agencyId/earnings')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('financials')
  @ApiOperation({ summary: 'List agency earnings (own agency only)' })
  listEarnings(
    @Param('agencyId') agencyId: string,
    @Query('status') status: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    return this.earningService.listEarnings(
      agencyId,
      status,
      user.agencyId,
      user.role,
    );
  }

  @Get(':agencyId/payouts')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('financials')
  @ApiOperation({ summary: 'List agency payouts (own agency only)' })
  listPayouts(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.earningService.listPayouts(agencyId, user.agencyId, user.role);
  }

  @Post(':agencyId/payouts')
  @Roles(...PLATFORM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Create payout from ACCRUED earnings' })
  createPayout(
    @Param('agencyId') agencyId: string,
    @Body() dto: CreatePayoutDto,
  ) {
    return this.earningService.createPayoutFromAccrued(agencyId, dto.note);
  }

  @Post('payouts/:payoutId/mark-paid')
  @Roles(...PLATFORM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark payout PAID (requires BankInfo)' })
  markPaid(@Param('payoutId') payoutId: string) {
    return this.earningService.markPayoutPaid(payoutId);
  }

  @Get(':agencyId/commission-rates')
  @Roles(...PLATFORM_ADMIN_ROLES)
  @ApiOperation({ summary: 'List commission rates' })
  listRates(@Param('agencyId') agencyId: string) {
    return this.commissionService.listRates(agencyId);
  }

  @Post(':agencyId/commission-rates')
  @Roles(...PLATFORM_ADMIN_ROLES)
  @ApiOperation({ summary: 'Add commission rate period' })
  upsertRate(
    @Param('agencyId') agencyId: string,
    @Body() dto: UpsertCommissionRateDto,
  ) {
    return this.commissionService.upsertRate(agencyId, dto);
  }

  @Get(':agencyId/bank-info')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('financials')
  @ApiOperation({ summary: 'Get AgencyBankInfo' })
  getBank(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.bankInfoService.get(agencyId, user.agencyId, user.role);
  }

  @Put(':agencyId/bank-info')
  @Roles(...AGENCY_SELLER_ROLES)
  @RequireStaffPermissions('financials')
  @ApiOperation({ summary: 'Upsert AgencyBankInfo' })
  upsertBank(
    @Param('agencyId') agencyId: string,
    @Body() dto: UpsertAgencyBankInfoDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.bankInfoService.upsert(agencyId, dto, user.agencyId, user.role);
  }
}
