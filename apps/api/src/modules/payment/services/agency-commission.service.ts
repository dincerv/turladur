import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import {
  parseAgencyBankAccountCreate,
  type AgencyBankAccountCreate,
} from '@turta/shared-validators';
import { ZodError } from 'zod';

import { PrismaService } from '../../../core/database/prisma.service';
import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';

@Injectable()
export class AgencyCommissionService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertRate(
    agencyId: string,
    dto: { ratePercent: number; effectiveFrom: string; effectiveTo?: string },
  ) {
    const agency = await this.prisma.agency.findFirst({
      where: { id: agencyId, deletedAt: null },
    });
    if (!agency) {
      throw new NotFoundException({
        code: 'AGENCY_NOT_FOUND',
        message: 'Acente bulunamadı',
      });
    }

    if (dto.ratePercent < 0 || dto.ratePercent > 100) {
      throw new BusinessException(
        'INVALID_RATE',
        'ratePercent 0–100 arasında olmalı',
      );
    }

    const row = await this.prisma.agencyCommissionRate.create({
      data: {
        agencyId,
        ratePercent: new Prisma.Decimal(dto.ratePercent),
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });

    return { success: true, data: row, error: null };
  }

  async listRates(agencyId: string) {
    const rows = await this.prisma.agencyCommissionRate.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: { effectiveFrom: 'desc' },
    });
    return { success: true, data: rows, error: null };
  }
}

@Injectable()
export class AgencyBankInfoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  private mapRow(row: {
    id: string;
    agencyId: string;
    iban: string;
    accountName: string;
    bankName: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      agencyId: row.agencyId,
      iban: row.iban,
      accountName: row.accountName,
      bankName: row.bankName,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(
    agencyId: string,
    actorPartnerId: string | undefined,
    role: string,
  ) {
    await this.agencyLink.assertAgencyAccessForPartner(
      agencyId,
      role,
      actorPartnerId,
    );
    const rows = await this.prisma.agencyBankInfo.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return {
      success: true,
      data: { items: rows.map((r) => this.mapRow(r)) },
      error: null,
    };
  }

  /** Legacy single-row getter — returns default or first account. */
  async get(
    agencyId: string,
    actorPartnerId: string | undefined,
    role: string,
  ) {
    await this.agencyLink.assertAgencyAccessForPartner(
      agencyId,
      role,
      actorPartnerId,
    );
    const row = await this.prisma.agencyBankInfo.findFirst({
      where: { agencyId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return {
      success: true,
      data: row ? this.mapRow(row) : null,
      error: null,
    };
  }

  async create(
    agencyId: string,
    raw: unknown,
    actorPartnerId: string | undefined,
    role: string,
  ) {
    await this.agencyLink.assertAgencyAccessForPartner(
      agencyId,
      role,
      actorPartnerId,
    );

    let dto: AgencyBankAccountCreate;
    try {
      dto = parseAgencyBankAccountCreate(raw);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'BANK_ACCOUNT_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz banka hesabı',
          details: error.issues,
        });
      }
      throw error;
    }

    const existingCount = await this.prisma.agencyBankInfo.count({
      where: { agencyId, deletedAt: null },
    });
    if (existingCount >= 10) {
      throw new BusinessException(
        'BANK_ACCOUNT_LIMIT',
        'En fazla 10 banka hesabı eklenebilir',
      );
    }

    const makeDefault = dto.isDefault || existingCount === 0;

    const row = await this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.agencyBankInfo.updateMany({
          where: { agencyId, deletedAt: null, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.agencyBankInfo.create({
        data: {
          agencyId,
          iban: dto.iban,
          accountName: dto.accountName,
          bankName: dto.bankName ?? null,
          isDefault: makeDefault,
        },
      });
    });

    return { success: true, data: this.mapRow(row), error: null };
  }

  /** Legacy upsert — updates default account or creates first. */
  async upsert(
    agencyId: string,
    dto: { iban: string; accountName: string; bankName?: string },
    actorPartnerId: string | undefined,
    role: string,
  ) {
    await this.agencyLink.assertAgencyAccessForPartner(
      agencyId,
      role,
      actorPartnerId,
    );

    let parsed: AgencyBankAccountCreate;
    try {
      parsed = parseAgencyBankAccountCreate({
        ...dto,
        isDefault: true,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'BANK_ACCOUNT_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz banka hesabı',
          details: error.issues,
        });
      }
      throw error;
    }

    const existing = await this.prisma.agencyBankInfo.findFirst({
      where: { agencyId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    if (existing) {
      const row = await this.prisma.agencyBankInfo.update({
        where: { id: existing.id },
        data: {
          iban: parsed.iban,
          accountName: parsed.accountName,
          bankName: parsed.bankName ?? null,
          isDefault: true,
          deletedAt: null,
        },
      });
      await this.prisma.agencyBankInfo.updateMany({
        where: {
          agencyId,
          deletedAt: null,
          id: { not: row.id },
          isDefault: true,
        },
        data: { isDefault: false },
      });
      return { success: true, data: this.mapRow(row), error: null };
    }

    return this.create(agencyId, parsed, actorPartnerId, role);
  }

  async setDefault(
    agencyId: string,
    bankInfoId: string,
    actorPartnerId: string | undefined,
    role: string,
  ) {
    await this.agencyLink.assertAgencyAccessForPartner(
      agencyId,
      role,
      actorPartnerId,
    );

    const target = await this.prisma.agencyBankInfo.findFirst({
      where: { id: bankInfoId, agencyId, deletedAt: null },
    });
    if (!target) {
      throw new NotFoundException({
        code: 'BANK_ACCOUNT_NOT_FOUND',
        message: 'Banka hesabı bulunamadı',
      });
    }

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.agencyBankInfo.updateMany({
        where: { agencyId, deletedAt: null, isDefault: true },
        data: { isDefault: false },
      });
      return tx.agencyBankInfo.update({
        where: { id: target.id },
        data: { isDefault: true },
      });
    });

    return { success: true, data: this.mapRow(row), error: null };
  }

  async softDelete(
    agencyId: string,
    bankInfoId: string,
    actorPartnerId: string | undefined,
    role: string,
  ) {
    await this.agencyLink.assertAgencyAccessForPartner(
      agencyId,
      role,
      actorPartnerId,
    );

    const target = await this.prisma.agencyBankInfo.findFirst({
      where: { id: bankInfoId, agencyId, deletedAt: null },
    });
    if (!target) {
      throw new NotFoundException({
        code: 'BANK_ACCOUNT_NOT_FOUND',
        message: 'Banka hesabı bulunamadı',
      });
    }

    const pending = await this.prisma.agencyPayout.count({
      where: {
        bankInfoId,
        deletedAt: null,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (pending > 0) {
      throw new BusinessException(
        'BANK_ACCOUNT_IN_USE',
        'Bekleyen payout talebi olan hesap silinemez',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.agencyBankInfo.update({
        where: { id: target.id },
        data: { deletedAt: new Date(), isDefault: false },
      });
      if (target.isDefault) {
        const next = await tx.agencyBankInfo.findFirst({
          where: { agencyId, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
        if (next) {
          await tx.agencyBankInfo.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return {
      success: true,
      data: { id: bankInfoId, deleted: true },
      error: null,
    };
  }
}
