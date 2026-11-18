import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';
import type { AgePricingType } from '@turta/shared-types';
import { Prisma } from '../../../generated/prisma';

import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { CreateAgeRangeDto, UpdateAgeRangeDto } from '../dto/age-range.dto';

@Injectable()
export class AgeRangeService {
  constructor(private readonly prisma: PrismaService) {}

  async listTourDateAgeRanges(tourId: string, dateId: string) {
    await this.requireTourDate(tourId, dateId);
    const rows = await this.prisma.tourDateAgeRange.findMany({
      where: { tourDateId: dateId, deletedAt: null },
      orderBy: { minAge: 'asc' },
    });
    return {
      success: true,
      data: rows.map((r) => this.toAgeRange(r)),
      error: null,
    };
  }

  async createTourDateAgeRange(
    tourId: string,
    dateId: string,
    dto: CreateAgeRangeDto,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwnedTourDate(tourId, dateId, agencyId, role);
    await this.assertNoOverlap(
      await this.prisma.tourDateAgeRange.findMany({
        where: { tourDateId: dateId, deletedAt: null },
      }),
      dto.minAge,
      dto.maxAge,
    );

    const row = await this.prisma.tourDateAgeRange.create({
      data: {
        tourDateId: dateId,
        minAge: dto.minAge,
        maxAge: dto.maxAge,
        pricingType: dto.pricingType,
        value: new Prisma.Decimal(dto.value),
      },
    });
    return { success: true, data: this.toAgeRange(row), error: null };
  }

  async updateTourDateAgeRange(
    tourId: string,
    dateId: string,
    ageRangeId: string,
    dto: UpdateAgeRangeDto,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwnedTourDate(tourId, dateId, agencyId, role);
    const existing = await this.prisma.tourDateAgeRange.findFirst({
      where: { id: ageRangeId, tourDateId: dateId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'AGE_RANGE_NOT_FOUND',
        message: 'Yaş aralığı bulunamadı',
      });
    }

    const minAge = dto.minAge ?? existing.minAge;
    const maxAge = dto.maxAge !== undefined ? dto.maxAge : existing.maxAge;
    const others = await this.prisma.tourDateAgeRange.findMany({
      where: {
        tourDateId: dateId,
        deletedAt: null,
        id: { not: ageRangeId },
      },
    });
    await this.assertNoOverlap(others, minAge, maxAge ?? undefined);

    const updated = await this.prisma.tourDateAgeRange.update({
      where: { id: existing.id },
      data: {
        minAge,
        maxAge,
        pricingType: dto.pricingType ?? existing.pricingType,
        value:
          dto.value !== undefined
            ? new Prisma.Decimal(dto.value)
            : existing.value,
      },
    });
    return { success: true, data: this.toAgeRange(updated), error: null };
  }

  async deleteTourDateAgeRange(
    tourId: string,
    dateId: string,
    ageRangeId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    await this.findOwnedTourDate(tourId, dateId, agencyId, role);
    const existing = await this.prisma.tourDateAgeRange.findFirst({
      where: { id: ageRangeId, tourDateId: dateId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'AGE_RANGE_NOT_FOUND',
        message: 'Yaş aralığı bulunamadı',
      });
    }
    await this.prisma.tourDateAgeRange.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    return {
      success: true,
      data: { id: ageRangeId, deleted: true },
      error: null,
    };
  }

  async listExperienceDateAgeRanges(experienceId: string, dateId: string) {
    await this.requireActivityDate(experienceId, dateId);
    const rows = await this.prisma.experienceDateAgeRange.findMany({
      where: { activityDateId: dateId, deletedAt: null },
      orderBy: { minAge: 'asc' },
    });
    return {
      success: true,
      data: rows.map((r) => this.toAgeRange(r)),
      error: null,
    };
  }

  async createExperienceDateAgeRange(
    experienceId: string,
    dateId: string,
    dto: CreateAgeRangeDto,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwnedActivityDate(experienceId, dateId, agencyId, role);
    await this.assertNoOverlap(
      await this.prisma.experienceDateAgeRange.findMany({
        where: { activityDateId: dateId, deletedAt: null },
      }),
      dto.minAge,
      dto.maxAge,
    );

    const row = await this.prisma.experienceDateAgeRange.create({
      data: {
        activityDateId: dateId,
        minAge: dto.minAge,
        maxAge: dto.maxAge,
        pricingType: dto.pricingType,
        value: new Prisma.Decimal(dto.value),
      },
    });
    return { success: true, data: this.toAgeRange(row), error: null };
  }

  async updateExperienceDateAgeRange(
    experienceId: string,
    dateId: string,
    ageRangeId: string,
    dto: UpdateAgeRangeDto,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwnedActivityDate(experienceId, dateId, agencyId, role);
    const existing = await this.prisma.experienceDateAgeRange.findFirst({
      where: { id: ageRangeId, activityDateId: dateId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'AGE_RANGE_NOT_FOUND',
        message: 'Yaş aralığı bulunamadı',
      });
    }

    const minAge = dto.minAge ?? existing.minAge;
    const maxAge = dto.maxAge !== undefined ? dto.maxAge : existing.maxAge;
    const others = await this.prisma.experienceDateAgeRange.findMany({
      where: {
        activityDateId: dateId,
        deletedAt: null,
        id: { not: ageRangeId },
      },
    });
    await this.assertNoOverlap(others, minAge, maxAge ?? undefined);

    const updated = await this.prisma.experienceDateAgeRange.update({
      where: { id: existing.id },
      data: {
        minAge,
        maxAge,
        pricingType: dto.pricingType ?? existing.pricingType,
        value:
          dto.value !== undefined
            ? new Prisma.Decimal(dto.value)
            : existing.value,
      },
    });
    return { success: true, data: this.toAgeRange(updated), error: null };
  }

  async deleteExperienceDateAgeRange(
    experienceId: string,
    dateId: string,
    ageRangeId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    await this.findOwnedActivityDate(experienceId, dateId, agencyId, role);
    const existing = await this.prisma.experienceDateAgeRange.findFirst({
      where: { id: ageRangeId, activityDateId: dateId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'AGE_RANGE_NOT_FOUND',
        message: 'Yaş aralığı bulunamadı',
      });
    }
    await this.prisma.experienceDateAgeRange.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    return {
      success: true,
      data: { id: ageRangeId, deleted: true },
      error: null,
    };
  }

  private async assertNoOverlap(
    existing: Array<{ minAge: number; maxAge: number | null }>,
    minAge: number,
    maxAge?: number,
  ) {
    const currentMax = maxAge ?? Number.POSITIVE_INFINITY;
    const hasOverlap = existing.some((range) => {
      const rangeMax = range.maxAge ?? Number.POSITIVE_INFINITY;
      return minAge <= rangeMax && currentMax >= range.minAge;
    });
    if (hasOverlap) {
      throw new BusinessException(
        'AGE_RANGE_OVERLAP',
        'Bu yaş aralığı mevcut bir aralıkla çakışıyor',
      );
    }
  }

  private async requireTourDate(tourId: string, dateId: string) {
    const key = tourId.trim();
    const tour = await this.prisma.tour.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: key }, { slug: key }],
      },
      select: { id: true },
    });
    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_DATE_NOT_FOUND',
        message: 'Tur tarihi bulunamadı',
      });
    }
    const date = await this.prisma.tourDate.findFirst({
      where: { id: dateId, tourId: tour.id, deletedAt: null },
      include: { tour: true },
    });
    if (!date || date.tour.deletedAt) {
      throw new NotFoundException({
        code: 'TOUR_DATE_NOT_FOUND',
        message: 'Tur tarihi bulunamadı',
      });
    }
    return date;
  }

  private async findOwnedTourDate(
    tourId: string,
    dateId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const date = await this.requireTourDate(tourId, dateId);
    const isAdmin = isPlatformAdminRole(role);
    if (!isAdmin && date.tour.agencyId !== agencyId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu tur tarihini yönetemezsiniz',
      });
    }
    return date;
  }

  private async requireActivityDate(experienceId: string, dateId: string) {
    const date = await this.prisma.activityDate.findFirst({
      where: { id: dateId, experienceId, deletedAt: null },
      include: { experience: true },
    });
    if (!date || date.experience.deletedAt) {
      throw new NotFoundException({
        code: 'ACTIVITY_DATE_NOT_FOUND',
        message: 'Aktivite tarihi bulunamadı',
      });
    }
    return date;
  }

  private async findOwnedActivityDate(
    experienceId: string,
    dateId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const date = await this.requireActivityDate(experienceId, dateId);
    const isAdmin = isPlatformAdminRole(role);
    if (!isAdmin && date.experience.agencyId !== agencyId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu aktivite tarihini yönetemezsiniz',
      });
    }
    return date;
  }

  private toAgeRange(row: {
    id: string;
    minAge: number;
    maxAge: number | null;
    pricingType: string;
    value: Prisma.Decimal;
  }) {
    return {
      id: row.id,
      minAge: row.minAge,
      maxAge: row.maxAge,
      pricingType: row.pricingType as AgePricingType,
      value: row.value.toString(),
    };
  }
}
