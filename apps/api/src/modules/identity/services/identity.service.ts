import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@turta/shared-constants';
import type { User as SharedUser } from '@turta/shared-types';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { AuditService } from '../../../core/audit/audit.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { EmailQueueService } from '../../../core/queue/email-queue.service';
import { UserRole, Prisma, OtpPurpose } from '../../../generated/prisma';
import { PartnerRegisteredEvent } from '../events/partner-registered.event';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterPartnerDto } from '../dto/register-partner.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { isValidTckn } from '../../../shared/utils/tckn';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { OtpService } from './otp.service';

const BCRYPT_ROUNDS = 12;

export type AuthSuccessWithRefresh<T> = {
  success: true;
  data: T;
  error: null;
  refresh?: { raw: string; expiresAt: Date };
};

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailQueue: EmailQueueService,
    private readonly otpService: OtpService,
    private readonly auditService: AuditService,
    private readonly authSession: AuthSessionService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  async register(dto: RegisterUserDto) {
    await this.ensureEmailAvailable(dto.email, 'customer');
    await this.otpService.verifyAndConsume(
      dto.email,
      OtpPurpose.REGISTER,
      dto.otpCode,
    );

    if (!isValidTckn(dto.identityNumber)) {
      throw new BadRequestException({
        code: 'INVALID_TCKN',
        message: 'TC Kimlik No geçersiz',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone.trim(),
        identityNumber: dto.identityNumber.trim(),
        address: dto.address.trim(),
        role: UserRole.CUSTOMER,
      },
    });

    // Consumer: DomainAuditListener; welcome e-posta burada (çift gönderim yok)
    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent(user.id, user.email, user.role),
    );

    await this.emailQueue.enqueue({
      to: user.email,
      template: 'welcome',
      data: { name: user.firstName ?? user.email },
    });

    const tokens = await this.authSession.issueForUser({
      userId: user.id,
      role: Role.CUSTOMER,
    });

    return this.withRefresh(
      {
        ...this.publicTokens(tokens),
        user: this.toSharedUser(user),
      },
      tokens,
    );
  }

  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase().trim(),
        deletedAt: null,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email veya şifre hatalı',
      });
    }

    await this.assertPartnerCanLogin(user);

    const role = this.mapRole(user.role);
    const tokens = await this.authSession.issueForUser({
      userId: user.id,
      role,
    });

    await this.auditService.record({
      actorType: 'USER',
      actorId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      meta: { role: user.role },
    });

    return this.withRefresh(
      {
        ...this.publicTokens(tokens),
        user: this.toSharedUser(user),
      },
      tokens,
    );
  }

  async resetPassword(dto: {
    email: string;
    code: string;
    newPassword: string;
  }) {
    const email = dto.email.toLowerCase().trim();
    await this.otpService.verifyAndConsume(
      email,
      OtpPurpose.PASSWORD_RESET,
      dto.code,
    );

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return {
      success: true,
      data: { reset: true },
      error: null,
    };
  }

  /**
   * Guest checkout: create a CUSTOMER for a new email and issue JWT.
   * If email already exists, client must login (no silent takeover).
   */
  async guestBootstrap(dto: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    billingLine1: string;
    billingCity: string;
    billingCountry?: string;
    identityNumber: string;
  }) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_REGISTERED',
        message:
          'Bu e-posta ile kayıtlı bir hesap var. Devam etmek için giriş yapın.',
      });
    }

    if (!isValidTckn(dto.identityNumber)) {
      throw new BusinessException(
        'INVALID_IDENTITY_NUMBER',
        'TC Kimlik No geçersiz',
      );
    }

    const passwordHash = await bcrypt.hash(randomUUID(), BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone.trim(),
        address: dto.address.trim(),
        billingLine1: dto.billingLine1.trim(),
        billingCity: dto.billingCity.trim(),
        billingCountry: dto.billingCountry?.trim() || 'Türkiye',
        identityNumber: dto.identityNumber.trim(),
        role: UserRole.CUSTOMER,
      },
    });

    // Consumer: DomainAuditListener (welcome e-posta bu register yolunda yok)
    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent(user.id, user.email, user.role),
    );

    const tokens = await this.authSession.issueForUser({
      userId: user.id,
      role: Role.CUSTOMER,
    });

    return this.withRefresh(
      {
        ...this.publicTokens(tokens),
        user: this.toSharedUser(user),
      },
      tokens,
    );
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    return {
      success: true,
      data: this.toSharedUser(user),
      error: null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.requireUser(userId);

    if (dto.identityNumber != null && dto.identityNumber !== '') {
      if (!isValidTckn(dto.identityNumber)) {
        throw new BusinessException(
          'INVALID_IDENTITY_NUMBER',
          'TC Kimlik No geçersiz',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined
          ? { firstName: dto.firstName.trim() }
          : {}),
        ...(dto.lastName !== undefined
          ? { lastName: dto.lastName.trim() }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone?.trim() || null }
          : {}),
        ...(dto.identityNumber !== undefined
          ? {
              identityNumber:
                dto.identityNumber === '' || dto.identityNumber == null
                  ? null
                  : dto.identityNumber,
            }
          : {}),
        ...(dto.birthDate !== undefined
          ? {
              birthDate:
                dto.birthDate === '' || dto.birthDate == null
                  ? null
                  : new Date(dto.birthDate),
            }
          : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() || null }
          : {}),
        ...(dto.billingLine1 !== undefined
          ? { billingLine1: dto.billingLine1?.trim() || null }
          : {}),
        ...(dto.billingLine2 !== undefined
          ? { billingLine2: dto.billingLine2?.trim() || null }
          : {}),
        ...(dto.billingCity !== undefined
          ? { billingCity: dto.billingCity?.trim() || null }
          : {}),
        ...(dto.billingState !== undefined
          ? { billingState: dto.billingState?.trim() || null }
          : {}),
        ...(dto.billingPostalCode !== undefined
          ? { billingPostalCode: dto.billingPostalCode?.trim() || null }
          : {}),
        ...(dto.billingCountry !== undefined
          ? { billingCountry: dto.billingCountry?.trim() || null }
          : {}),
      },
    });

    return {
      success: true,
      data: this.toSharedUser(updated),
      error: null,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.requireUser(userId);

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Mevcut şifre hatalı',
      });
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BusinessException(
        'PASSWORD_UNCHANGED',
        'Yeni şifre mevcut şifre ile aynı olamaz',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return {
      success: true,
      data: { updated: true },
      error: null,
    };
  }

  async registerPartner(dto: RegisterPartnerDto) {
    await this.ensureEmailAvailable(dto.contactEmail, 'partner');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const email = dto.contactEmail.toLowerCase().trim();
    const companyName = dto.companyName.trim();
    const taxNumber =
      dto.taxNumber?.replace(/\D/g, '').slice(0, 11) ||
      `9${Date.now().toString().slice(-9)}`;

    const staffExists = await this.prisma.agencyStaff.findFirst({
      where: { email, deletedAt: null },
    });
    if (staffExists) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_PARTNER',
        message:
          'Bu e-posta ile acente hesabı zaten var. Partner girişinden devam edin.',
      });
    }

    const agency = await this.prisma.agency.create({
      data: {
        companyName,
        taxNumber,
        legalTitle: companyName,
        address: dto.address?.trim() || 'Adres girilecek',
        city: dto.city?.trim() || null,
        country: dto.country?.trim() || 'Türkiye',
        website: dto.website?.trim() || null,
        contactEmail: email,
        contactPhone: dto.contactPhone?.trim() || null,
        status: 'PENDING',
        capabilities: ['TOURS'],
      },
    });

    const staff = await this.prisma.agencyStaff.create({
      data: {
        agencyId: agency.id,
        name:
          [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim() ||
          companyName,
        email,
        passwordHash,
        role: 'AGENCY_OWNER',
        status: 'ACTIVE',
      },
    });

    // Consumer: DomainAuditListener — onay e-postası partner.verified’da
    this.eventEmitter.emit(
      'partner.registered',
      new PartnerRegisteredEvent(agency.id, staff.id, email, ''),
    );

    return {
      success: true,
      data: {
        agency: {
          id: agency.id,
          companyName: agency.companyName,
          status: agency.status,
          contactEmail: agency.contactEmail,
        },
        message:
          'Acente kaydı oluşturuldu. Onay sonrası agency-staff girişi ile panele erişin.',
      },
      error: null,
    };
  }

  async verifyPartner(_token: string) {
    throw new NotFoundException({
      code: 'LEGACY_PARTNER_VERIFY_DROPPED',
      message:
        'Eski partner doğrulama kaldırıldı. Acente kaydı AgencyStaff girişi ile çalışır.',
    });
  }

  private partnerWebBaseUrl(): string {
    return (
      this.config.get<string>('EMAIL_BRAND_URL') ??
      this.config.get<string>('FRONTEND_URL') ??
      'https://turladur-zjyf.vercel.app'
    )
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
  }

  private async assertPartnerCanLogin(user: { role: UserRole }): Promise<void> {
    if (
      user.role === UserRole.PARTNER ||
      user.role === UserRole.PARTNER_STAFF
    ) {
      throw new BusinessException(
        'USE_AGENCY_STAFF_LOGIN',
        'Partner girişi kaldırıldı. /partner-login üzerinden acente personeli girişi kullanın.',
        403,
      );
    }
  }

  private async ensureEmailAvailable(
    email: string,
    context: 'customer' | 'partner' = 'customer',
  ): Promise<void> {
    const normalized = email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findFirst({
      where: { email: normalized, deletedAt: null },
      select: { id: true, role: true },
    });

    if (existingUser) {
      if (context === 'partner') {
        if (
          existingUser.role === UserRole.PARTNER ||
          existingUser.role === UserRole.PARTNER_STAFF
        ) {
          throw new ConflictException({
            code: 'EMAIL_ALREADY_PARTNER',
            message:
              'Bu e-posta ile partner hesabı zaten var. Partner girişinden devam edin.',
          });
        }
        throw new ConflictException({
          code: 'EMAIL_ALREADY_CUSTOMER',
          message:
            'Bu e-posta müşteri hesabı olarak kayıtlı. Partner kayıt için farklı bir e-posta kullanın.',
        });
      }

      if (
        existingUser.role === UserRole.PARTNER ||
        existingUser.role === UserRole.PARTNER_STAFF
      ) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_PARTNER',
          message:
            'Bu e-posta partner hesabına ait. Müşteri kaydı için farklı e-posta kullanın veya partner girişinden devam edin.',
        });
      }

      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Bu e-posta adresi zaten kayıtlı',
      });
    }

    if (context === 'partner') {
      const existingPartner = await this.prisma.agency.findFirst({
        where: { contactEmail: normalized, deletedAt: null },
        select: { id: true },
      });
      if (existingPartner) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_PARTNER',
          message:
            'Bu e-posta ile partner firması zaten kayıtlı. Partner girişinden devam edin.',
        });
      }
    }
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }
    return user;
  }

  private withRefresh<T>(
    data: T,
    tokens: {
      refreshTokenRaw?: string;
      refreshExpiresAt?: Date;
    },
  ): AuthSuccessWithRefresh<T> {
    return {
      success: true,
      data,
      error: null,
      ...(tokens.refreshTokenRaw && tokens.refreshExpiresAt
        ? {
            refresh: {
              raw: tokens.refreshTokenRaw,
              expiresAt: tokens.refreshExpiresAt,
            },
          }
        : {}),
    };
  }

  private publicTokens(tokens: {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: string;
  }) {
    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
    };
  }

  private mapRole(role: UserRole): Role {
    return Role[role as keyof typeof Role] ?? Role.CUSTOMER;
  }

  private toSharedUser(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    identityNumber?: string | null;
    birthDate?: Date | null;
    address?: string | null;
    billingLine1?: string | null;
    billingLine2?: string | null;
    billingCity?: string | null;
    billingState?: string | null;
    billingPostalCode?: string | null;
    billingCountry?: string | null;
    role: UserRole;
    permissions?: Prisma.JsonValue | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SharedUser {
    const permissions =
      user.permissions &&
      typeof user.permissions === 'object' &&
      !Array.isArray(user.permissions)
        ? (user.permissions as SharedUser['permissions'])
        : null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      identityNumber: user.identityNumber ?? null,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().slice(0, 10)
        : null,
      address: user.address ?? null,
      billingLine1: user.billingLine1 ?? null,
      billingLine2: user.billingLine2 ?? null,
      billingCity: user.billingCity ?? null,
      billingState: user.billingState ?? null,
      billingPostalCode: user.billingPostalCode ?? null,
      billingCountry: user.billingCountry ?? null,
      role: user.role,
      partnerId: null,
      permissions,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
