import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@turta/shared-constants';
import * as bcrypt from 'bcrypt';

import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import {
  AuthActorType,
  JwtPayload,
  SessionActorRef,
} from '../types/auth.types';
import { RefreshTokenService } from './refresh-token.service';

export type AccessTokenBundle = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  refreshTokenRaw?: string;
  refreshExpiresAt?: Date;
};

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly auditService: AuditService,
  ) {}

  async issueForUser(input: {
    userId: string;
    role: Role;
    agencyId?: string | null;
  }): Promise<AccessTokenBundle> {
    const payload: JwtPayload = {
      sub: input.userId,
      role: input.role,
      actorType: 'USER',
      agencyId: input.agencyId ?? undefined,
    };
    return this.issueSession(payload, {
      actorType: 'USER',
      userId: input.userId,
    });
  }

  async loginAgencyStaff(
    email: string,
    password: string,
  ): Promise<{
    tokens: AccessTokenBundle;
    staff: {
      id: string;
      agencyId: string;
      email: string;
      name: string;
      role: string;
      permissions: unknown;
    };
  }> {
    const staff = await this.prisma.agencyStaff.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deletedAt: null,
      },
    });
    if (!staff || staff.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }
    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }

    await this.prisma.agencyStaff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    const role = this.mapAgencyStaffRole(staff.role);
    const tokens = await this.issueSession(
      {
        sub: staff.id,
        role,
        actorType: 'AGENCY_STAFF',
        agencyId: staff.agencyId,
        agencyStaffId: staff.id,
      },
      {
        actorType: 'AGENCY_STAFF',
        agencyStaffId: staff.id,
        agencyId: staff.agencyId,
      },
    );

    await this.auditService.record({
      actorType: 'AGENCY_STAFF',
      actorId: staff.id,
      action: 'LOGIN',
      entityType: 'AgencyStaff',
      entityId: staff.id,
      meta: { agencyId: staff.agencyId, role: staff.role },
    });

    return {
      tokens,
      staff: {
        id: staff.id,
        agencyId: staff.agencyId,
        email: staff.email,
        name: staff.name,
        role: this.mapAgencyStaffRole(staff.role),
        permissions: staff.permissions ?? {},
      },
    };
  }

  async loginGuide(
    email: string,
    password: string,
  ): Promise<{
    tokens: AccessTokenBundle;
    guide: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      status: string;
    };
  }> {
    const guide = await this.prisma.guide.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
    });
    if (!guide || guide.status === 'REJECTED' || guide.status === 'SUSPENDED') {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }
    const ok = await bcrypt.compare(password, guide.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }

    const tokens = await this.issueSession(
      {
        sub: guide.id,
        role: Role.GUIDE,
        actorType: 'GUIDE',
        guideId: guide.id,
      },
      { actorType: 'GUIDE', guideId: guide.id },
    );

    await this.auditService.record({
      actorType: 'GUIDE',
      actorId: guide.id,
      action: 'LOGIN',
      entityType: 'Guide',
      entityId: guide.id,
    });

    return {
      tokens,
      guide: {
        id: guide.id,
        email: guide.email,
        firstName: guide.firstName,
        lastName: guide.lastName,
        status: guide.status,
      },
    };
  }

  async loginBusCompany(
    email: string,
    password: string,
  ): Promise<{
    tokens: AccessTokenBundle;
    busCompany: {
      id: string;
      companyName: string;
      contactEmail: string;
      status: string;
    };
  }> {
    const bus = await this.prisma.busCompany.findFirst({
      where: { contactEmail: email.toLowerCase().trim(), deletedAt: null },
    });
    if (!bus || bus.status === 'REJECTED' || bus.status === 'SUSPENDED') {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }
    const ok = await bcrypt.compare(password, bus.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }

    const tokens = await this.issueSession(
      {
        sub: bus.id,
        role: Role.BUS_COMPANY,
        actorType: 'BUS_COMPANY',
        busCompanyId: bus.id,
      },
      { actorType: 'BUS_COMPANY', busCompanyId: bus.id },
    );

    await this.auditService.record({
      actorType: 'BUS_COMPANY',
      actorId: bus.id,
      action: 'LOGIN',
      entityType: 'BusCompany',
      entityId: bus.id,
    });

    return {
      tokens,
      busCompany: {
        id: bus.id,
        companyName: bus.companyName,
        contactEmail: bus.contactEmail,
        status: bus.status,
      },
    };
  }

  async refreshFromRaw(rawToken: string): Promise<AccessTokenBundle> {
    if (!this.refreshTokens.isEnabled()) {
      throw new UnauthorizedException({
        code: 'REFRESH_DISABLED',
        message: 'Refresh oturumu kapalı',
      });
    }
    const { issued, actor } = await this.refreshTokens.rotate(rawToken);
    const payload = await this.payloadFromActor(actor);
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      refreshTokenRaw: issued.rawToken,
      refreshExpiresAt: issued.expiresAt,
    };
  }

  /** Middleware/session probe — refresh rotate etmez. */
  async probeFromRefresh(rawToken: string): Promise<{
    authenticated: true;
    role: Role;
    actorType: AuthActorType;
    userId: string;
    agencyId?: string;
    agencyStaffId?: string;
    guideId?: string;
    busCompanyId?: string;
    email?: string;
    name?: string;
    permissions?: unknown;
    expiresAt: string;
  }> {
    if (!this.refreshTokens.isEnabled()) {
      throw new UnauthorizedException({
        code: 'REFRESH_DISABLED',
        message: 'Refresh oturumu kapalı',
      });
    }
    const peeked = await this.refreshTokens.peek(rawToken);
    const payload = await this.payloadFromActor(peeked.actor);

    let email: string | undefined;
    let name: string | undefined;
    let permissions: unknown;
    if (peeked.actor.actorType === 'AGENCY_STAFF') {
      const staff = await this.prisma.agencyStaff.findFirst({
        where: { id: peeked.actor.agencyStaffId, deletedAt: null },
        select: { email: true, name: true, permissions: true },
      });
      email = staff?.email;
      name = staff?.name;
      permissions = staff?.permissions ?? {};
    }

    return {
      authenticated: true,
      role: payload.role,
      actorType: payload.actorType,
      userId: payload.sub,
      agencyId: payload.agencyId,
      agencyStaffId: payload.agencyStaffId,
      guideId: payload.guideId,
      busCompanyId: payload.busCompanyId,
      email,
      name,
      permissions,
      expiresAt: peeked.expiresAt.toISOString(),
    };
  }

  async payloadFromActor(actor: SessionActorRef): Promise<JwtPayload> {
    switch (actor.actorType) {
      case 'USER': {
        const user = await this.prisma.user.findFirst({
          where: { id: actor.userId, deletedAt: null, isActive: true },
        });
        if (!user) {
          throw new UnauthorizedException({
            code: 'REFRESH_INVALID',
            message: 'Kullanıcı bulunamadı',
          });
        }
        return {
          sub: user.id,
          role: Role[user.role as keyof typeof Role] ?? Role.CUSTOMER,
          actorType: 'USER',
        };
      }
      case 'AGENCY_STAFF': {
        const staff = await this.prisma.agencyStaff.findFirst({
          where: {
            id: actor.agencyStaffId,
            deletedAt: null,
            status: 'ACTIVE',
          },
        });
        if (!staff) {
          throw new UnauthorizedException({
            code: 'REFRESH_INVALID',
            message: 'Acente personeli bulunamadı',
          });
        }
        return {
          sub: staff.id,
          role: this.mapAgencyStaffRole(staff.role),
          actorType: 'AGENCY_STAFF',
          agencyId: staff.agencyId,
          agencyStaffId: staff.id,
        };
      }
      case 'GUIDE': {
        const guide = await this.prisma.guide.findFirst({
          where: { id: actor.guideId, deletedAt: null },
        });
        if (
          !guide ||
          guide.status === 'REJECTED' ||
          guide.status === 'SUSPENDED'
        ) {
          throw new UnauthorizedException({
            code: 'REFRESH_INVALID',
            message: 'Rehber bulunamadı',
          });
        }
        return {
          sub: guide.id,
          role: Role.GUIDE,
          actorType: 'GUIDE',
          guideId: guide.id,
        };
      }
      case 'BUS_COMPANY': {
        const bus = await this.prisma.busCompany.findFirst({
          where: { id: actor.busCompanyId, deletedAt: null },
        });
        if (!bus || bus.status === 'REJECTED' || bus.status === 'SUSPENDED') {
          throw new UnauthorizedException({
            code: 'REFRESH_INVALID',
            message: 'Otobüs firması bulunamadı',
          });
        }
        return {
          sub: bus.id,
          role: Role.BUS_COMPANY,
          actorType: 'BUS_COMPANY',
          busCompanyId: bus.id,
        };
      }
    }
  }

  actorRefFromPayload(payload: {
    actorType?: AuthActorType;
    userId: string;
    agencyStaffId?: string;
    agencyId?: string;
    guideId?: string;
    busCompanyId?: string;
  }): SessionActorRef {
    const actorType = payload.actorType ?? 'USER';
    switch (actorType) {
      case 'AGENCY_STAFF':
        if (!payload.agencyStaffId || !payload.agencyId) {
          throw new UnauthorizedException({
            code: 'FORBIDDEN',
            message: 'Acente oturumu eksik',
          });
        }
        return {
          actorType: 'AGENCY_STAFF',
          agencyStaffId: payload.agencyStaffId,
          agencyId: payload.agencyId,
        };
      case 'GUIDE':
        return {
          actorType: 'GUIDE',
          guideId: payload.guideId ?? payload.userId,
        };
      case 'BUS_COMPANY':
        return {
          actorType: 'BUS_COMPANY',
          busCompanyId: payload.busCompanyId ?? payload.userId,
        };
      default:
        return { actorType: 'USER', userId: payload.userId };
    }
  }

  private async issueSession(
    payload: JwtPayload,
    actor: SessionActorRef,
  ): Promise<AccessTokenBundle> {
    const accessToken = await this.jwtService.signAsync(payload);
    const bundle: AccessTokenBundle = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    };

    if (this.refreshTokens.isEnabled()) {
      const issued = await this.refreshTokens.issue(actor);
      bundle.refreshTokenRaw = issued.rawToken;
      bundle.refreshExpiresAt = issued.expiresAt;
    }

    return bundle;
  }

  private mapAgencyStaffRole(role: string): Role {
    if (role === 'AGENCY_OWNER') return Role.AGENCY_OWNER;
    if (role === 'AGENCY_ADMIN') return Role.AGENCY_ADMIN;
    return Role.AGENCY_STAFF;
  }
}
