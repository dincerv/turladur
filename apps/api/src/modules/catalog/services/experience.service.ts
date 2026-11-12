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

@Injectable()
export class ExperienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async search(dto: SearchExperiencesDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_PAGE_LIMIT;
    const q = dto.q?.trim() ?? '';

    const where: Prisma.ExperienceWhereInput = {
      deletedAt: null,
      status: 'PUBLISHED',
      ...(dto.category
        ? { category: { contains: dto.category, mode: 'insensitive' } }
        : {}),
      ...(dto.location
        ? { location: { contains: dto.location, mode: 'insensitive' } }
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
    });
    if (!experience) {
      throw new NotFoundException({
        code: 'EXPERIENCE_NOT_FOUND',
        message: 'Deneyim bulunamadı',
      });
    }
    return {
      success: true,
      data: this.toExperience(experience),
      error: null,
    };
  }

  async create(dto: CreateExperienceDto, agencyId: string | undefined) {
    await this.ensurePartnerCapability(agencyId);

    const slug = await this.uniqueSlug(slugify(dto.title));
    const experience = await this.prisma.experience.create({
      data: {
        title: dto.title.trim(),
        slug,
        description: dto.description.trim(),
        longDescription: dto.longDescription.trim(),
        category: dto.category.trim(),
        location: dto.location.trim(),
        duration: dto.duration.trim(),
        price: new Prisma.Decimal(dto.price),
        currency: dto.currency ?? DEFAULT_CURRENCY,
        ageRestriction: dto.ageRestriction,
        imageUrl: dto.imageUrl,
        meetingPoint: dto.meetingPoint,
        agencyId: agencyId!,
        status: 'PENDING_REVIEW',
      },
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
      data.title = dto.title.trim();
      data.slug = await this.uniqueSlug(slugify(dto.title), experienceId);
    }
    if (dto.description !== undefined)
      data.description = dto.description.trim();
    if (dto.longDescription !== undefined)
      data.longDescription = dto.longDescription.trim();
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.location !== undefined) data.location = dto.location.trim();
    if (dto.duration !== undefined) data.duration = dto.duration.trim();
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.meetingPoint !== undefined)
      data.meetingPoint = dto.meetingPoint?.trim() || null;
    if (dto.ageRestriction !== undefined)
      data.ageRestriction = dto.ageRestriction?.trim() || null;

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
