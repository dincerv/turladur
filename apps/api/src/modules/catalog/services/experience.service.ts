import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';
import {
  DEFAULT_CURRENCY,
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
} from '@turta/shared-constants';
import type {
  ActivityDate as SharedActivityDate,
  Experience as SharedExperience,
  ExperienceDetail as SharedExperienceDetail,
  ExperienceScheduleItem,
  MembershipTier as SharedMembershipTier,
} from '@turta/shared-types';
import { Prisma } from '../../../generated/prisma';

import { CacheService } from '../../../core/cache/cache.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import {
  CreateActivityDateDto,
  CreateExperienceDto,
  SearchExperiencesDto,
  UpdateActivityDateDto,
  UpdateExperienceDto,
} from '../dto/experience.dto';
import { slugify } from '../utils/slugify';

const MEMBERSHIP_TIERS = new Set<string>(['BRONZE', 'SILVER', 'GOLD']);
const MAX_LIST_ITEMS = 50;

/** Json columns are partner-authored; keep only non-empty strings. */
function toStringList(value: Prisma.JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

/** Accepts `[{ time, activity }]` or plain strings ("09:00 — Toplanma"). */
function toScheduleList(
  value: Prisma.JsonValue | undefined,
): ExperienceScheduleItem[] {
  if (!Array.isArray(value)) return [];
  const out: ExperienceScheduleItem[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      out.push({ time: '', activity: item.trim() });
    } else if (item && typeof item === 'object' && !Array.isArray(item)) {
      const time = typeof item.time === 'string' ? item.time.trim() : '';
      const activity =
        typeof item.activity === 'string' ? item.activity.trim() : '';
      if (activity) out.push({ time, activity });
    }
    if (out.length >= MAX_LIST_ITEMS) break;
  }
  return out;
}

@Injectable()
export class ExperienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async search(dto: SearchExperiencesDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_PAGE_LIMIT;
    const q = (dto.q?.trim() ?? '')
      .slice(0, 100)
      .replace(/[\u0000-\u001F\u007F]/g, '');
    const category = (dto.category?.trim() ?? '')
      .slice(0, 120)
      .replace(/[\u0000-\u001F\u007F]/g, '');
    const location = (dto.location?.trim() ?? '')
      .slice(0, 200)
      .replace(/[\u0000-\u001F\u007F]/g, '');

    const where: Prisma.ExperienceWhereInput = {
      deletedAt: null,
      status: 'PUBLISHED',
      ...(category
        ? { category: { contains: category, mode: 'insensitive' } }
        : {}),
      ...(location
        ? { location: { contains: location, mode: 'insensitive' } }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.experience.count({ where }),
      this.prisma.experience.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          location: true,
          duration: true,
          price: true,
          status: true,
          agencyId: true,
          averageRating: true,
          reviewCount: true,
          ageRestriction: true,
          imageUrl: true,
          featured: true,
          popularityRate: true,
        },
      }),
    ]);

    return {
      success: true,
      data: rows.map((e) => this.toExperience(e)),
      error: null,
      meta: { page, limit, total },
    };
  }

  async getById(experienceId: string) {
    const experience = await this.prisma.experience.findFirst({
      where: { id: experienceId, deletedAt: null, status: 'PUBLISHED' },
      include: {
        agency: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            sellerTier: true,
            averageRating: true,
            reviewCount: true,
          },
        },
      },
    });
    if (!experience) {
      throw new NotFoundException({
        code: 'EXPERIENCE_NOT_FOUND',
        message: 'Deneyim bulunamadı',
      });
    }
    return {
      success: true,
      data: this.toExperienceDetail(experience),
      error: null,
    };
  }

  async create(dto: CreateExperienceDto, agencyId: string | undefined) {
    await this.ensurePartnerCapability(agencyId);

    const safeTitle = this.sanitizePlain(dto.title, 200);
    const slug = await this.uniqueSlug(slugify(safeTitle));
    const included = this.sanitizeStringList(dto.included, 50, 200);
    const notIncluded = this.sanitizeStringList(dto.notIncluded, 50, 200);
    const highlights = this.sanitizeStringList(dto.highlights, 30, 200);
    const gallery = this.sanitizeStringList(dto.gallery, 20, 2000);

    const hasDate = Boolean(dto.dateStart && dto.dateEnd);
    if (hasDate) {
      const startDate = new Date(dto.dateStart!);
      const endDate = new Date(dto.dateEnd!);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate < startDate
      ) {
        throw new BusinessException(
          'INVALID_DATE_RANGE',
          'Bitiş tarihi başlangıçtan önce olamaz',
        );
      }
    }

    if (dto.price < 0) {
      throw new BusinessException('INVALID_PRICE', 'Fiyat negatif olamaz');
    }

    const experience = await this.prisma.$transaction(async (tx) => {
      const created = await tx.experience.create({
        data: {
          title: safeTitle,
          slug,
          description: this.sanitizePlain(dto.description, 5000),
          longDescription: this.sanitizePlain(dto.longDescription, 20_000),
          category: this.sanitizePlain(dto.category, 120),
          location: this.sanitizePlain(dto.location, 200),
          duration: this.sanitizePlain(dto.duration, 80),
          price: new Prisma.Decimal(dto.price),
          currency: (dto.currency ?? DEFAULT_CURRENCY).slice(0, 3),
          ageRestriction: dto.ageRestriction
            ? this.sanitizePlain(dto.ageRestriction, 80)
            : null,
          imageUrl: dto.imageUrl
            ? this.sanitizePlain(dto.imageUrl, 2000)
            : null,
          gallery,
          included,
          notIncluded,
          highlights,
          meetingPoint: dto.meetingPoint
            ? this.sanitizePlain(dto.meetingPoint, 300)
            : null,
          agencyId: agencyId!,
          status: 'PENDING_REVIEW',
        },
      });

      if (hasDate) {
        const seats = dto.dateSeats ?? 12;
        await tx.activityDate.create({
          data: {
            experienceId: created.id,
            startDate: new Date(dto.dateStart!),
            endDate: new Date(dto.dateEnd!),
            price: new Prisma.Decimal(dto.price),
            availableSeats: seats,
            remainingCapacity: seats,
          },
        });
      }

      return created;
    });

    await this.cache.invalidatePattern('catalog:experiences:*');
    return {
      success: true,
      data: this.toExperience(experience),
      error: null,
    };
  }

  async update(
    experienceId: string,
    dto: UpdateExperienceDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const experience = await this.findOwned(experienceId, agencyId, role);
    const data: Prisma.ExperienceUpdateInput = {};
    if (dto.title !== undefined) {
      const safeTitle = this.sanitizePlain(dto.title, 200);
      data.title = safeTitle;
      data.slug = await this.uniqueSlug(slugify(safeTitle), experienceId);
    }
    if (dto.description !== undefined)
      data.description = this.sanitizePlain(dto.description, 5000);
    if (dto.longDescription !== undefined)
      data.longDescription = this.sanitizePlain(dto.longDescription, 20_000);
    if (dto.category !== undefined)
      data.category = this.sanitizePlain(dto.category, 120);
    if (dto.location !== undefined)
      data.location = this.sanitizePlain(dto.location, 200);
    if (dto.duration !== undefined)
      data.duration = this.sanitizePlain(dto.duration, 80);
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.meetingPoint !== undefined)
      data.meetingPoint = dto.meetingPoint
        ? this.sanitizePlain(dto.meetingPoint, 300)
        : null;
    if (dto.ageRestriction !== undefined)
      data.ageRestriction = dto.ageRestriction
        ? this.sanitizePlain(dto.ageRestriction, 80)
        : null;

    const updated = await this.prisma.experience.update({
      where: { id: experience.id },
      data,
    });
    await this.cache.invalidatePattern('catalog:experiences:*');
    return { success: true, data: this.toExperience(updated), error: null };
  }

  async softDelete(
    experienceId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const experience = await this.findOwned(experienceId, agencyId, role);
    await this.prisma.experience.update({
      where: { id: experience.id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    await this.cache.invalidatePattern('catalog:experiences:*');
    return {
      success: true,
      data: { id: experienceId, deleted: true },
      error: null,
    };
  }

  async listDates(experienceId: string) {
    await this.requirePublishedOrAny(experienceId);
    const dates = await this.prisma.activityDate.findMany({
      where: { experienceId, deletedAt: null, isActive: true },
      orderBy: { startDate: 'asc' },
    });
    return {
      success: true,
      data: dates.map((d) => this.toActivityDate(d)),
      error: null,
    };
  }

  async createDate(
    experienceId: string,
    dto: CreateActivityDateDto,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwned(experienceId, agencyId, role);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BusinessException(
        'INVALID_DATE_RANGE',
        'Bitiş tarihi başlangıçtan önce olamaz',
      );
    }

    const date = await this.prisma.activityDate.create({
      data: {
        experienceId,
        startDate,
        endDate,
        price: new Prisma.Decimal(dto.price),
        availableSeats: dto.availableSeats,
        remainingCapacity: dto.availableSeats,
      },
    });
    return { success: true, data: this.toActivityDate(date), error: null };
  }

  async updateDate(
    experienceId: string,
    dateId: string,
    dto: UpdateActivityDateDto,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwned(experienceId, agencyId, role);
    const existing = await this.prisma.activityDate.findFirst({
      where: { id: dateId, experienceId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'ACTIVITY_DATE_NOT_FOUND',
        message: 'Aktivite tarihi bulunamadı',
      });
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    if (endDate < startDate) {
      throw new BusinessException(
        'INVALID_DATE_RANGE',
        'Bitiş tarihi başlangıçtan önce olamaz',
      );
    }

    const data: Prisma.ActivityDateUpdateInput = {
      startDate,
      endDate,
    };
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.availableSeats !== undefined) {
      data.availableSeats = dto.availableSeats;
      const booked =
        existing.availableSeats -
        (existing.remainingCapacity ?? existing.availableSeats);
      data.remainingCapacity = Math.max(0, dto.availableSeats - booked);
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.activityDate.update({
      where: { id: existing.id },
      data,
    });
    return { success: true, data: this.toActivityDate(updated), error: null };
  }

  async softDeleteDate(
    experienceId: string,
    dateId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    await this.findOwned(experienceId, agencyId, role);
    const existing = await this.prisma.activityDate.findFirst({
      where: { id: dateId, experienceId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'ACTIVITY_DATE_NOT_FOUND',
        message: 'Aktivite tarihi bulunamadı',
      });
    }
    await this.prisma.activityDate.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    return {
      success: true,
      data: { id: dateId, deleted: true },
      error: null,
    };
  }

  async listForPartner(agencyId: string | undefined) {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'PARTNER_REQUIRED',
        message: 'Partner hesabı gerekli',
      });
    }
    const rows = await this.prisma.experience.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: rows.map((e) => this.toExperience(e)),
      error: null,
    };
  }

  private async ensurePartnerCapability(agencyId: string | undefined) {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'PARTNER_REQUIRED',
        message: 'Partner hesabı gerekli',
      });
    }
    const partner = await this.prisma.agency.findFirst({
      where: { id: agencyId, deletedAt: null },
    });
    if (!partner || partner.status !== 'VERIFIED') {
      throw new ForbiddenException({
        code: 'PARTNER_NOT_VERIFIED',
        message: 'Doğrulanmış partner hesabı gerekli',
      });
    }
    if (
      partner.capabilities.length > 0 &&
      !partner.capabilities.includes('TOURS')
    ) {
      throw new ForbiddenException({
        code: 'CAPABILITY_REQUIRED',
        message: 'Bu işlem için EXPERIENCES yetkisi gerekli',
      });
    }
  }

  /** Strip tags + control chars before persisting partner-authored text. */
  private sanitizePlain(input: string, max: number): string {
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim()
      .slice(0, max);
  }

  private sanitizeStringList(
    input: string[] | undefined,
    maxItems: number,
    maxLen: number,
  ): string[] {
    if (!Array.isArray(input)) return [];
    return input
      .filter((v): v is string => typeof v === 'string')
      .map((v) => this.sanitizePlain(v, maxLen))
      .filter(Boolean)
      .slice(0, maxItems);
  }

  private async findOwned(
    experienceId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const experience = await this.prisma.experience.findFirst({
      where: { id: experienceId, deletedAt: null },
    });
    if (!experience) {
      throw new NotFoundException({
        code: 'EXPERIENCE_NOT_FOUND',
        message: 'Deneyim bulunamadı',
      });
    }
    const isAdmin = isPlatformAdminRole(role);
    if (!isAdmin && experience.agencyId !== agencyId) {
      throw new ForbiddenException({
        code: 'NOT_EXPERIENCE_OWNER',
        message: 'Bu deneyimi yönetemezsiniz',
      });
    }
    return experience;
  }

  private async requirePublishedOrAny(experienceId: string) {
    const experience = await this.prisma.experience.findFirst({
      where: { id: experienceId, deletedAt: null },
    });
    if (!experience) {
      throw new NotFoundException({
        code: 'EXPERIENCE_NOT_FOUND',
        message: 'Deneyim bulunamadı',
      });
    }
    return experience;
  }

  private async uniqueSlug(base: string, excludeId?: string) {
    let slug = base;
    let i = 0;
    while (true) {
      const existing = await this.prisma.experience.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!existing) return slug;
      i += 1;
      slug = `${base}-${i}`;
    }
  }

  private toExperience(row: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    location: string;
    duration: string;
    price: Prisma.Decimal;
    status: string;
    agencyId: string;
    averageRating: Prisma.Decimal;
    reviewCount: number;
    ageRestriction?: string | null;
    imageUrl?: string | null;
    featured?: boolean;
    popularityRate?: number;
  }): SharedExperience {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      category: row.category,
      location: row.location,
      duration: row.duration,
      price: row.price.toString(),
      status: row.status as SharedExperience['status'],
      partnerId: row.agencyId,
      agencyId: row.agencyId,
      averageRating: row.averageRating.toString(),
      reviewCount: row.reviewCount,
      ageRestriction: row.ageRestriction ?? null,
      imageUrl: row.imageUrl ?? null,
      featured: Boolean(row.featured),
      popularityRate: row.popularityRate ?? 0,
    };
  }

  private toExperienceDetail(
    row: Parameters<ExperienceService['toExperience']>[0] & {
      longDescription?: string | null;
      currency?: string | null;
      gallery?: Prisma.JsonValue;
      included?: Prisma.JsonValue;
      notIncluded?: Prisma.JsonValue;
      highlights?: Prisma.JsonValue;
      schedule?: Prisma.JsonValue;
      meetingPoint?: string | null;
      meetingPointAddress?: string | null;
      agency?: {
        id: string;
        companyName: string;
        logo: string | null;
        sellerTier: string;
        averageRating: Prisma.Decimal;
        reviewCount: number;
      } | null;
    },
  ): SharedExperienceDetail {
    const agency = row.agency ?? null;
    return {
      ...this.toExperience(row),
      longDescription: row.longDescription ?? '',
      currency: row.currency || DEFAULT_CURRENCY,
      gallery: toStringList(row.gallery),
      included: toStringList(row.included),
      notIncluded: toStringList(row.notIncluded),
      highlights: toStringList(row.highlights),
      schedule: toScheduleList(row.schedule),
      meetingPoint: row.meetingPoint?.trim() || null,
      meetingPointAddress: row.meetingPointAddress?.trim() || null,
      operator: agency
        ? {
            id: agency.id,
            companyName: agency.companyName,
            logo: agency.logo ?? null,
            membershipTier: MEMBERSHIP_TIERS.has(agency.sellerTier)
              ? (agency.sellerTier as SharedMembershipTier)
              : null,
            averageRating: agency.averageRating.toString(),
            reviewCount: agency.reviewCount,
          }
        : null,
    };
  }

  private toActivityDate(row: {
    id: string;
    experienceId: string;
    startDate: Date;
    endDate: Date;
    price: Prisma.Decimal;
    availableSeats: number;
    isActive: boolean;
  }): SharedActivityDate {
    return {
      id: row.id,
      experienceId: row.experienceId,
      startDate: row.startDate.toISOString().slice(0, 10),
      endDate: row.endDate.toISOString().slice(0, 10),
      price: row.price.toString(),
      availableSeats: row.availableSeats,
      isActive: row.isActive,
    };
  }
}
