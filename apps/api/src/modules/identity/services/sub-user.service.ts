import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SubUser as SharedSubUser } from '@turta/shared-types';
import {
  mapAgencyStaffRoleToUi,
  mapUiRoleToAgencyStaffRole,
  parseCreateAgencyStaff,
  parseUpdateAgencyStaff,
} from '@turta/shared-validators';
import * as bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { Prisma } from '../../../generated/prisma';

import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { CreateSubUserDto, UpdateSubUserDto } from '../dto/sub-user.dto';

const BCRYPT_ROUNDS = 12;

/** P0-A: SubUser table DROPPED — AgencyStaff CRUD (FE /partner/users BC). */
@Injectable()
export class SubUserService {
  constructor(private readonly prisma: PrismaService) {}

  async list(agencyId: string, actor: ActorContext) {
    this.assertOwnerOnly(agencyId, actor);

    const rows = await this.prisma.agencyStaff.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: rows.map((row) => this.toShared(row)),
      error: null,
    };
  }

  async create(agencyId: string, dto: CreateSubUserDto, actor: ActorContext) {
    this.assertOwnerOnly(agencyId, actor);
    await this.requireAgency(agencyId);

    let parsed;
    try {
      parsed = parseCreateAgencyStaff({
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: this.normalizeIncomingRole(dto.role),
        permissions: dto.permissions,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'STAFF_CREATE_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz personel verisi',
          details: error.issues,
        });
      }
      throw error;
    }

    const email = parsed.email.toLowerCase().trim();
    const existing = await this.prisma.agencyStaff.findFirst({
      where: { agencyId, email, deletedAt: null },
    });
    if (existing) {
      throw new BusinessException(
        'SUB_USER_EMAIL_EXISTS',
        'Bu email adresi zaten kullanımda',
      );
    }

    const passwordHash = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);
    const permissions = (parsed.permissions ??
      {}) as unknown as Prisma.InputJsonValue;
    const role = mapUiRoleToAgencyStaffRole(parsed.role);

    const row = await this.prisma.agencyStaff.create({
      data: {
        agencyId,
        name: parsed.name,
        email,
        passwordHash,
        role,
        permissions,
        status: parsed.status ?? 'ACTIVE',
        createdBy: actor.agencyStaffId ?? actor.userId,
      },
    });

    return { success: true, data: this.toShared(row), error: null };
  }

  async update(
    agencyId: string,
    subUserId: string,
    dto: UpdateSubUserDto,
    actor: ActorContext,
  ) {
    this.assertOwnerOnly(agencyId, actor);
    const existing = await this.prisma.agencyStaff.findFirst({
      where: { id: subUserId, agencyId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'SUB_USER_NOT_FOUND',
        message: 'Alt kullanıcı bulunamadı',
      });
    }

    let parsed;
    try {
      parsed = parseUpdateAgencyStaff({
        name: dto.name,
        role: dto.role ? this.normalizeIncomingRole(dto.role) : undefined,
        status: dto.status,
        password: dto.password,
        permissions: dto.permissions,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'STAFF_UPDATE_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz personel güncellemesi',
          details: error.issues,
        });
      }
      throw error;
    }

    const isSelf = this.isSelf(actor, existing.id);
    const nextRole = parsed.role
      ? mapUiRoleToAgencyStaffRole(parsed.role)
      : existing.role;

    if (isSelf && parsed.role && nextRole !== 'AGENCY_OWNER') {
      throw new BusinessException(
        'SELF_DEMOTION_FORBIDDEN',
        'Kendi OWNER rolünüzü düşüremezsiniz',
      );
    }

    if (isSelf && parsed.status === 'INACTIVE') {
      throw new BusinessException(
        'SELF_DEACTIVATE_FORBIDDEN',
        'Kendi hesabınızı pasife alamazsınız',
      );
    }

    if (existing.role === 'AGENCY_OWNER' && nextRole !== 'AGENCY_OWNER') {
      await this.assertNotLastOwner(agencyId, existing.id);
    }

    const data: Prisma.AgencyStaffUpdateInput = {
      updatedBy: actor.agencyStaffId ?? actor.userId,
    };
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.role !== undefined) data.role = nextRole;
    if (parsed.permissions !== undefined) {
      data.permissions = parsed.permissions as unknown as Prisma.InputJsonValue;
    }
    if (parsed.password) {
      data.passwordHash = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);
    }

    const updated = await this.prisma.agencyStaff.update({
      where: { id: existing.id },
      data,
    });

    return { success: true, data: this.toShared(updated), error: null };
  }

  async softDelete(agencyId: string, subUserId: string, actor: ActorContext) {
    this.assertOwnerOnly(agencyId, actor);
    const existing = await this.prisma.agencyStaff.findFirst({
      where: { id: subUserId, agencyId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'SUB_USER_NOT_FOUND',
        message: 'Alt kullanıcı bulunamadı',
      });
    }

    if (this.isSelf(actor, existing.id)) {
      throw new BusinessException(
        'SELF_DELETE_FORBIDDEN',
        'Kendinizi silemezsiniz',
      );
    }

    if (existing.role === 'AGENCY_OWNER') {
      await this.assertNotLastOwner(agencyId, existing.id);
    }

    await this.prisma.agencyStaff.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
        deletedBy: actor.agencyStaffId ?? actor.userId ?? actor.agencyId,
      },
    });

    return {
      success: true,
      data: { id: subUserId, deleted: true },
      error: null,
    };
  }

  private async assertNotLastOwner(agencyId: string, excludeId: string) {
    const owners = await this.prisma.agencyStaff.count({
      where: {
        agencyId,
        deletedAt: null,
        role: 'AGENCY_OWNER',
        status: 'ACTIVE',
        id: { not: excludeId },
      },
    });
    if (owners === 0) {
      throw new BusinessException(
        'LAST_OWNER_PROTECTED',
        'Son OWNER silinemez veya düşürülemez',
      );
    }
  }

  private isSelf(actor: ActorContext, staffId: string): boolean {
    return Boolean(actor.agencyStaffId && actor.agencyStaffId === staffId);
  }

  private normalizeIncomingRole(role?: string): string {
    if (!role) return 'AGENT';
    const upper = role.trim().toUpperCase();
    if (upper === 'AGENCY_OWNER' || upper === 'OWNER') return 'OWNER';
    if (upper === 'AGENCY_ADMIN' || upper === 'MANAGER' || upper === 'ADMIN') {
      return 'MANAGER';
    }
    if (upper === 'AGENCY_STAFF' || upper === 'AGENT' || upper === 'USER') {
      return 'AGENT';
    }
    return 'AGENT';
  }

  private async requireAgency(agencyId: string) {
    const agency = await this.prisma.agency.findFirst({
      where: { id: agencyId, deletedAt: null },
    });
    if (!agency) {
      throw new NotFoundException({
        code: 'AGENCY_NOT_FOUND',
        message: 'Acente bulunamadı',
      });
    }
    return agency;
  }

  /** Users CRUD: OWNER only (+ platform). MANAGER/STAFF forbidden. */
  private assertOwnerOnly(agencyId: string, actor: ActorContext) {
    if (isPlatformAdminRole(actor.role)) return;

    if (actor.role === 'AGENCY_OWNER' || actor.role === 'PARTNER') {
      if (actor.agencyId && actor.agencyId !== agencyId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Bu acenteyi yönetemezsiniz',
        });
      }
      return;
    }

    throw new ForbiddenException({
      code: 'FORBIDDEN',
      message: 'Personel yönetimi yalnızca acente sahibine (OWNER) açıktır',
    });
  }

  private toShared(row: {
    id: string;
    agencyId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    permissions: Prisma.JsonValue;
    lastLoginAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): SharedSubUser & {
    uiRole: string;
    lastLoginAt: string | null;
    createdAt?: string;
    updatedAt?: string;
  } {
    return {
      id: row.id,
      partnerId: row.agencyId,
      name: row.name,
      email: row.email,
      role: row.role,
      uiRole: mapAgencyStaffRoleToUi(row.role),
      status: row.status,
      permissions:
        row.permissions && typeof row.permissions === 'object'
          ? (row.permissions as Record<string, unknown>)
          : {},
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
  }
}

type ActorContext = {
  userId?: string;
  agencyId?: string;
  agencyStaffId?: string;
  role?: string;
};
