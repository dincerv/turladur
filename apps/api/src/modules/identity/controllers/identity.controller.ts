import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@turta/shared-constants';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { RefreshCookieService } from '../../../core/auth/services/refresh-cookie.service';
import { RefreshTokenService } from '../../../core/auth/services/refresh-token.service';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { AuditService } from '../../../core/audit/audit.service';
import { ChangePasswordCommand } from '../commands/change-password/change-password.command';
import { LoginUserCommand } from '../commands/login-user/login-user.command';
import { RegisterPartnerCommand } from '../commands/register-partner/register-partner.command';
import { RegisterUserCommand } from '../commands/register-user/register-user.command';
import { UpdateProfileCommand } from '../commands/update-profile/update-profile.command';
import { VerifyPartnerCommand } from '../commands/verify-partner/verify-partner.command';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RegisterGuideDto, UpdateGuideProfileDto } from '../dto/guide.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterPartnerDto } from '../dto/register-partner.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { VerifyPartnerDto } from '../dto/verify-partner.dto';
import { GuestBootstrapDto } from '../dto/guest-bootstrap.dto';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { GetProfileQuery } from '../queries/get-profile/get-profile.query';
import {
  AuthSuccessWithRefresh,
  IdentityService,
} from '../services/identity.service';
import { GuideService } from '../services/guide.service';
import { OtpService } from '../services/otp.service';

@ApiTags('Identity')
@Controller('identity')
export class IdentityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly identityService: IdentityService,
    private readonly guideService: GuideService,
    private readonly otpService: OtpService,
    private readonly authSession: AuthSessionService,
    private readonly refreshCookies: RefreshCookieService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly auditService: AuditService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new customer user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  async register(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = (await this.commandBus.execute(
      new RegisterUserCommand(dto),
    )) as AuthSuccessWithRefresh<unknown>;
    this.applyRefreshCookie(res, result);
    return this.stripRefresh(result);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Login and receive JWT access token + refresh cookie',
  })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = (await this.commandBus.execute(
      new LoginUserCommand(dto),
    )) as AuthSuccessWithRefresh<unknown>;
    this.applyRefreshCookie(res, result);
    return this.stripRefresh(result);
  }

  @Public()
  // Agency panel E2E + staff retries need headroom; still rate-limited.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('agency-staff/login')
  @ApiOperation({
    summary: 'Marketplace AgencyStaff login (OWNER/ADMIN/STAFF)',
  })
  async loginAgencyStaff(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, staff } = await this.authSession.loginAgencyStaff(
      dto.email,
      dto.password,
    );
    if (tokens.refreshTokenRaw && tokens.refreshExpiresAt) {
      this.refreshCookies.attach(
        res,
        tokens.refreshTokenRaw,
        tokens.refreshExpiresAt,
      );
    }
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn,
        staff,
      },
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('guides/register')
  @ApiOperation({
    summary: 'Guide membership register (status PENDING — admin verifies)',
  })
  async registerGuide(
    @Body() dto: RegisterGuideDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const created = await this.guideService.register(dto);
    const { tokens, guide } = await this.authSession.loginGuide(
      dto.email,
      dto.password,
    );
    if (tokens.refreshTokenRaw && tokens.refreshExpiresAt) {
      this.refreshCookies.attach(
        res,
        tokens.refreshTokenRaw,
        tokens.refreshExpiresAt,
      );
    }
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn,
        guide: { ...guide, ...created.data },
      },
      error: null,
    };
  }

  @Get('guides/me')
  @Roles(Role.GUIDE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Guide self profile (TUREB card fields)' })
  getGuideMe(@CurrentUser() user: UserPayload) {
    const guideId = user.guideId ?? user.userId;
    return this.guideService.getProfile(guideId);
  }

  @Patch('guides/me')
  @Roles(Role.GUIDE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update guide self profile' })
  patchGuideMe(
    @Body() dto: UpdateGuideProfileDto,
    @CurrentUser() user: UserPayload,
  ) {
    const guideId = user.guideId ?? user.userId;
    return this.guideService.updateProfile(guideId, dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('guides/login')
  @ApiOperation({ summary: 'Guide login' })
  async loginGuide(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, guide } = await this.authSession.loginGuide(
      dto.email,
      dto.password,
    );
    if (tokens.refreshTokenRaw && tokens.refreshExpiresAt) {
      this.refreshCookies.attach(
        res,
        tokens.refreshTokenRaw,
        tokens.refreshExpiresAt,
      );
    }
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn,
        guide,
      },
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('bus-companies/login')
  @ApiOperation({ summary: 'Bus company login' })
  async loginBusCompany(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, busCompany } = await this.authSession.loginBusCompany(
      dto.email,
      dto.password,
    );
    if (tokens.refreshTokenRaw && tokens.refreshExpiresAt) {
      this.refreshCookies.attach(
        res,
        tokens.refreshTokenRaw,
        tokens.refreshExpiresAt,
      );
    }
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn,
        busCompany,
      },
      error: null,
    };
  }

  @Public()
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Get('session')
  @ApiOperation({
    summary:
      'Session probe from refresh cookie (no rotate) — middleware / edge guard',
  })
  async sessionProbe(@Req() req: Request) {
    const raw = this.refreshCookies.read(req);
    if (!raw) {
      return {
        success: true,
        data: { authenticated: false as const },
        error: null,
      };
    }
    try {
      const session = await this.authSession.probeFromRefresh(raw);
      return { success: true, data: session, error: null };
    } catch {
      return {
        success: true,
        data: { authenticated: false as const },
        error: null,
      };
    }
  }

  @Public()
  // Agency E2E: every test hard-nav + bootstrap hits refresh; keep generous headroom.
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh cookie → new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = this.refreshCookies.read(req);
    if (!raw) {
      return {
        success: false,
        data: null,
        error: {
          code: 'REFRESH_MISSING',
          message: 'Refresh oturumu yok',
        },
      };
    }
    const tokens = await this.authSession.refreshFromRaw(raw);
    if (tokens.refreshTokenRaw && tokens.refreshExpiresAt) {
      this.refreshCookies.attach(
        res,
        tokens.refreshTokenRaw,
        tokens.refreshExpiresAt,
      );
    }
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn,
      },
      error: null,
    };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke current refresh session + clear cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = this.refreshCookies.read(req);
    if (raw) {
      await this.refreshTokens.revokeRaw(raw);
    }
    this.refreshCookies.clear(res);
    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'LOGOUT',
      entityType: 'RefreshToken',
      entityId: null,
    });
    return { success: true, data: { loggedOut: true }, error: null };
  }

  @Post('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for current actor' })
  async logoutAll(
    @CurrentUser() user: UserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const actor = this.authSession.actorRefFromPayload(user);
    const count = await this.refreshTokens.revokeAllForActor(actor);
    this.refreshCookies.clear(res);
    await this.auditService.record({
      actorType: user.actorType,
      actorId: user.userId,
      action: 'LOGOUT_ALL',
      entityType: 'RefreshToken',
      entityId: user.userId,
      meta: { count },
    });
    return { success: true, data: { revoked: count }, error: null };
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active refresh sessions (multi-device)' })
  async listSessions(@CurrentUser() user: UserPayload) {
    const actor = this.authSession.actorRefFromPayload(user);
    const sessions = await this.refreshTokens.listSessions(actor);
    return { success: true, data: sessions, error: null };
  }

  @Delete('sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke one session family by id' })
  async revokeSession(
    @CurrentUser() user: UserPayload,
    @Param('id') sessionId: string,
  ) {
    const actor = this.authSession.actorRefFromPayload(user);
    await this.refreshTokens.revokeSession(sessionId, actor);
    return { success: true, data: { revoked: true }, error: null };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('otp/send')
  @ApiOperation({
    summary: 'Send 6-digit email OTP (CHECKOUT | REGISTER | PASSWORD_RESET)',
  })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.send(dto.email, dto.purpose, dto.firstName);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify email OTP code' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verify(dto.email, dto.purpose, dto.code);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password with email OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.identityService.resetPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('guest-bootstrap')
  @ApiOperation({
    summary:
      'Guest checkout bootstrap — creates CUSTOMER for new email and returns JWT',
  })
  async guestBootstrap(
    @Body() dto: GuestBootstrapDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = (await this.identityService.guestBootstrap(
      dto,
    )) as AuthSuccessWithRefresh<unknown>;
    this.applyRefreshCookie(res, result);
    return this.stripRefresh(result);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile (USER actor)' })
  @Roles(
    Role.CUSTOMER,
    Role.PARTNER,
    Role.PARTNER_STAFF,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.PLATFORM_ADMIN,
    Role.PLATFORM_SUPER_ADMIN,
  )
  profile(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(new GetProfileQuery(user.userId));
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update profile (name, phone, TC, personal + billing address)',
  })
  @Roles(
    Role.CUSTOMER,
    Role.PARTNER,
    Role.PARTNER_STAFF,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.PLATFORM_ADMIN,
    Role.PLATFORM_SUPER_ADMIN,
  )
  updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.commandBus.execute(new UpdateProfileCommand(user.userId, dto));
  }

  @Post('profile/password')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Change password (current + new)' })
  @Roles(
    Role.CUSTOMER,
    Role.PARTNER,
    Role.PARTNER_STAFF,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.PLATFORM_ADMIN,
    Role.PLATFORM_SUPER_ADMIN,
  )
  changePassword(
    @CurrentUser() user: UserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.commandBus.execute(new ChangePasswordCommand(user.userId, dto));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('partners/register')
  @ApiOperation({ summary: 'Register a partner company + owner account' })
  registerPartner(@Body() dto: RegisterPartnerDto) {
    return this.commandBus.execute(new RegisterPartnerCommand(dto));
  }

  @Public()
  @Post('partners/verify')
  @ApiOperation({ summary: 'Verify partner email with token' })
  verifyPartner(@Body() dto: VerifyPartnerDto) {
    return this.commandBus.execute(new VerifyPartnerCommand(dto.token));
  }

  private applyRefreshCookie(
    res: Response,
    result: AuthSuccessWithRefresh<unknown>,
  ) {
    if (result.refresh) {
      this.refreshCookies.attach(
        res,
        result.refresh.raw,
        result.refresh.expiresAt,
      );
    }
  }

  private stripRefresh<T>(result: AuthSuccessWithRefresh<T>) {
    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  }
}
