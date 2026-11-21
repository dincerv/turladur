import { GoneException, Injectable, NotFoundException } from '@nestjs/common';

import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';
import { PrismaService } from '../../../core/database/prisma.service';
import { StorageService } from '../../../core/storage/storage.service';
import {
  CreateAgencyDto,
  SearchAgenciesDto,
  UpdateAgencyDto,
} from '../dto/agency.dto';

type ActorContext = {
  userId?: string;
  role?: string;
};

/**
 * Marketplace Agency (satıcı) public okuma.
 * Legacy B2B Agency CRUD → P0-A DROP → 410 Gone.
 */
@Injectable()
export class AgencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private gone(): never {
    throw new GoneException({
      code: 'LEGACY_AGENCY_DROPPED',
      message:
        'Legacy B2B Agency API kaldırıldı. Satıcı acente: AgencyStaff girişi kullanın.',
    });
  }

  private isAdmin(role?: string): boolean {
    return isPlatformAdminRole(role);
  }

  async create(_dto: CreateAgencyDto, _userId: string) {
    this.gone();
  }

  /** Public marketplace directory — VERIFIED sellers only (admin may pass status). */
  async search(dto: SearchAgenciesDto, actor?: ActorContext) {
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(100, Math.max(1, dto.limit ?? 20));
    const q = dto.q?.trim() ?? '';
    const isAdmin = this.isAdmin(actor?.role);

    const statusFilter = isAdmin
      ? dto.status === 'APPROVED'
        ? ('VERIFIED' as const)
        : dto.status === 'PENDING'
          ? ('PENDING' as const)
          : dto.status === 'SUSPENDED'
            ? ('SUSPENDED' as const)
            : dto.status === 'REJECTED'
              ? ('REJECTED' as const)
              : undefined
      : ('VERIFIED' as const);

    const where = {
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { companyName: { contains: q, mode: 'insensitive' as const } },
              { city: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.agency.count({ where }),
      this.prisma.agency.findMany({
        where,
        orderBy: [{ sellerTier: 'desc' }, { averageRating: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          companyName: true,
          logo: true,
          city: true,
          country: true,
          website: true,
          sellerTier: true,
          averageRating: true,
          reviewCount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const agencyIds = rows.map((row) => row.id);
    const tourCounts =
      agencyIds.length === 0
        ? []
        : await this.prisma.tour.groupBy({
            by: ['agencyId'],
            where: {
              agencyId: { in: agencyIds },
              deletedAt: null,
              status: 'PUBLISHED',
            },
            _count: { _all: true },
          });
    const countByAgency = new Map(
      tourCounts.map((row) => [row.agencyId, row._count._all]),
    );

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        companyName: row.companyName,
        logo: this.storage.resolvePublicUrl(row.logo),
        city: row.city,
        country: row.country,
        website: row.website,
        membershipTier: row.sellerTier,
        averageRating: row.averageRating.toString(),
        reviewCount: row.reviewCount,
        status: row.status,
        publishedTourCount: countByAgency.get(row.id) ?? 0,
        description: null as string | null,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      error: null,
    };
  }

  /** Public marketplace seller profile (VERIFIED). Admin sees any non-deleted. */
  async getById(agencyId: string, actor?: ActorContext) {
    const isAdmin = this.isAdmin(actor?.role);
    const row = await this.prisma.agency.findFirst({
      where: {
        id: agencyId,
        deletedAt: null,
        ...(isAdmin ? {} : { status: 'VERIFIED' }),
      },
      select: {
        id: true,
        companyName: true,
        logo: true,
        city: true,
        country: true,
        website: true,
        sellerTier: true,
        averageRating: true,
        reviewCount: true,
        status: true,
        createdAt: true,
      },
    });

    if (!row) {
      throw new NotFoundException({
        code: 'AGENCY_NOT_FOUND',
        message: 'Tur operatörü bulunamadı',
      });
    }

    const publishedTourCount = await this.prisma.tour.count({
      where: {
        agencyId: row.id,
        deletedAt: null,
        status: 'PUBLISHED',
      },
    });

    return {
      success: true,
      data: {
        id: row.id,
        companyName: row.companyName,
        logo: this.storage.resolvePublicUrl(row.logo),
        city: row.city,
        country: row.country,
        website: row.website,
        membershipTier: row.sellerTier,
        averageRating: row.averageRating.toString(),
        reviewCount: row.reviewCount,
        status: row.status,
        publishedTourCount,
        description: null as string | null,
        createdAt: row.createdAt.toISOString(),
      },
      error: null,
    };
  }

  async update(_agencyId: string, _dto: UpdateAgencyDto, _actor: ActorContext) {
    this.gone();
  }

  async setStatus(_agencyId: string, _status: string, _actor?: ActorContext) {
    this.gone();
  }

  async remove(_agencyId: string, _actor: ActorContext) {
    this.gone();
  }

  async getMine(_userId: string) {
    this.gone();
  }

  async softDelete(_agencyId: string, _actor: ActorContext) {
    this.gone();
  }
}
