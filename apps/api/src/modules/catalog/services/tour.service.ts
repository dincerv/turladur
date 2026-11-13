import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DEFAULT_CURRENCY,
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
  normalizeDepartureCity,
  TOUR_CANCEL_REASON_LABELS,
  TourCancelReason,
} from '@turta/shared-constants';
import type {
  Tour as SharedTour,
  TourDate as SharedTourDate,
} from '@turta/shared-types';
import { Prisma } from '../../../generated/prisma';

import { CacheService } from '../../../core/cache/cache.service';
import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { StorageService } from '../../../core/storage/storage.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { CreateTourDateDto } from '../dto/create-tour-date.dto';
import { CreateTourDto } from '../dto/create-tour.dto';
import { SearchToursDto } from '../dto/search-tours.dto';
import { UpdateTourDto } from '../dto/update-tour.dto';
import { TourCancelledEvent } from '../events/tour-cancelled.event';
import { TourDatesCancelledEvent } from '../events/tour-dates-cancelled.event';
import { TourCreatedEvent } from '../events/tour-created.event';
import { TourSearchPerformedEvent } from '../events/tour-search-performed.event';
import {
  sanitizeTourExtras,
  sanitizeTourPlainText,
} from '../utils/sanitize-tour-text';
import { resolveTourTaxonomy } from '../utils/tour-taxonomy';
import { slugify } from '../utils/slugify';

function formatTourDateLabel(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const startLabel = fmt.format(start);
  const endLabel = fmt.format(end);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

const SEARCH_CACHE_TTL_SECONDS = 300;

@Injectable()
export class TourService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: StorageService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  async create(dto: CreateTourDto, agencyId: string | undefined) {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'PARTNER_REQUIRED',
        message: 'Tur oluşturmak için partner hesabı gerekir',
      });
    }

    // Ownership always from JWT session — never trust body.agencyId.
    await this.ensurePartnerCanPublish(agencyId);

    const safeTitle = sanitizeTourPlainText(dto.title, 200);
    const safeDescription = sanitizeTourPlainText(dto.description, 20_000);
    const safeExtras = sanitizeTourExtras(dto.extras);

    if (safeTitle.length < 3) {
      throw new BusinessException('INVALID_TITLE', 'Tur başlığı geçersiz');
    }
    if (safeDescription.length < 10) {
      throw new BusinessException(
        'INVALID_DESCRIPTION',
        'Tur açıklaması geçersiz',
      );
    }

    const baseSlug = slugify(safeTitle);
    const slug = await this.uniqueSlug(baseSlug);
    const taxonomy = resolveTourTaxonomy({
      stayKind: dto.stayKind,
      destinationScope: dto.destinationScope,
      departureCities: dto.departureCities,
      durationDays: dto.durationDays,
      extras: safeExtras,
    });

    const status = dto.asDraft ? 'DRAFT' : 'PENDING_REVIEW';
    const nestedDates = dto.dates ?? [];
    const nestedPickups = dto.pickupPoints ?? [];

    for (const date of nestedDates) {
      const startDate = new Date(date.startDate);
      const endDate = new Date(date.endDate);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        throw new BusinessException(
          'INVALID_DATE_RANGE',
          'Geçersiz tur tarihi',
        );
      }
      if (endDate < startDate) {
        throw new BusinessException(
          'INVALID_DATE_RANGE',
          'Bitiş tarihi başlangıçtan önce olamaz',
        );
      }
    }

    const tour = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tour.create({
        data: {
          title: safeTitle,
          slug,
          description: safeDescription,
          price: new Prisma.Decimal(dto.price),
          currency: dto.currency ?? DEFAULT_CURRENCY,
          category: dto.category,
          durationDays: taxonomy.durationDays,
          stayKind: taxonomy.stayKind,
          destinationScope: taxonomy.destinationScope,
          departureCities: taxonomy.departureCities,
          coverUrl: dto.coverUrl,
          galleryUrls: dto.galleryUrls ?? [],
          extras: safeExtras as Prisma.InputJsonValue,
          agencyId,
          status,
        },
      });

      for (const date of nestedDates) {
        const startDate = new Date(date.startDate);
        const endDate = new Date(date.endDate);
        const tourDate = await tx.tourDate.create({
          data: {
            tourId: created.id,
            startDate,
            endDate,
            capacity: date.capacity,
            remainingCapacity: date.capacity,
            priceOverride:
              date.priceOverride !== undefined
                ? new Prisma.Decimal(date.priceOverride)
                : null,
          },
        });

        for (const range of date.ageRanges ?? []) {
          await tx.tourDateAgeRange.create({
            data: {
              tourDateId: tourDate.id,
              minAge: range.minAge,
              maxAge: range.maxAge ?? null,
              pricingType: range.pricingType,
              value: new Prisma.Decimal(range.value),
            },
          });
        }
      }

      for (const [index, point] of nestedPickups.entries()) {
        await tx.tourPickupPoint.create({
          data: {
            tourId: created.id,
            city: sanitizeTourPlainText(point.city, 100),
            location: sanitizeTourPlainText(point.location, 200),
            time: sanitizeTourPlainText(point.time, 20),
            description: point.description
              ? sanitizeTourPlainText(point.description, 500)
              : undefined,
            latitude: point.latitude ?? null,
            longitude: point.longitude ?? null,
            order: point.order ?? index,
          },
        });
      }

      if (dto.accommodation) {
        await tx.tourAccommodation.create({
          data: {
            tourId: created.id,
            name: sanitizeTourPlainText(dto.accommodation.name, 200),
            image: dto.accommodation.image,
            location: sanitizeTourPlainText(dto.accommodation.location, 120),
            type: sanitizeTourPlainText(dto.accommodation.type, 80),
            rating: 0,
            features: [],
          },
        });
      }

      return created;
    });

    await this.cache.invalidatePattern('catalog:tours:search:*');
    await this.cache.del(`partner:dashboard:${agencyId}`);

    this.eventEmitter.emit(
      'tour.created',
      new TourCreatedEvent(tour.id, agencyId),
    );

    return {
      success: true,
      data: this.toSharedTour(tour),
      error: null,
    };
  }

  async update(
    tourId: string,
    dto: UpdateTourDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);

    const data: Prisma.TourUpdateInput = {};
    if (dto.title !== undefined) {
      const safeTitle = sanitizeTourPlainText(dto.title, 200);
      data.title = safeTitle;
      data.slug = await this.uniqueSlug(slugify(safeTitle), tourId);
    }
    if (dto.description !== undefined) {
      data.description = sanitizeTourPlainText(dto.description, 20_000);
    }
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.status !== undefined) data.status = dto.status;

    const safeExtrasUpdate =
      dto.extras !== undefined
        ? sanitizeTourExtras(dto.extras as Record<string, unknown>)
        : undefined;
    if (safeExtrasUpdate) {
      data.extras = safeExtrasUpdate as Prisma.InputJsonValue;
    }

    if (
      dto.stayKind !== undefined ||
      dto.destinationScope !== undefined ||
      dto.departureCities !== undefined ||
      dto.durationDays !== undefined ||
      dto.extras !== undefined
    ) {
      const taxonomy = resolveTourTaxonomy({
        stayKind: dto.stayKind ?? tour.stayKind,
        destinationScope: dto.destinationScope ?? tour.destinationScope,
        departureCities: dto.departureCities ?? tour.departureCities,
        durationDays: dto.durationDays ?? tour.durationDays,
        extras: safeExtrasUpdate ?? tour.extras,
      });
      data.stayKind = taxonomy.stayKind;
      data.destinationScope = taxonomy.destinationScope;
      data.departureCities = taxonomy.departureCities;
      data.durationDays = taxonomy.durationDays;
    }
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;
    if (dto.galleryUrls !== undefined) data.galleryUrls = dto.galleryUrls;

    if (dto.status === 'PUBLISHED') {
      await this.ensureTourCanBePublished(tour);
    }

    const nestedDates = dto.dates ?? [];
    for (const date of nestedDates) {
      const startDate = new Date(date.startDate);
      const endDate = new Date(date.endDate);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        throw new BusinessException(
          'INVALID_DATE_RANGE',
          'Geçersiz tur tarihi',
        );
      }
      if (endDate < startDate) {
        throw new BusinessException(
          'INVALID_DATE_RANGE',
          'Bitiş tarihi başlangıçtan önce olamaz',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.tour.update({
        where: { id: tour.id },
        data,
      });

      if (dto.dates !== undefined) {
        const existing = await tx.tourDate.findMany({
          where: { tourId, deletedAt: null, isActive: true },
          select: { id: true, startDate: true, endDate: true },
        });
        const payloadKeys = new Set(
          nestedDates.map(
            (d) =>
              `${this.toDayKey(new Date(d.startDate))}|${this.toDayKey(new Date(d.endDate))}`,
          ),
        );
        const existingKeys = new Set(
          existing.map(
            (d) => `${this.toDayKey(d.startDate)}|${this.toDayKey(d.endDate)}`,
          ),
        );

        // Soft-delete removed dates (no orphan rows); block if active bookings exist.
        for (const d of existing) {
          const key = `${this.toDayKey(d.startDate)}|${this.toDayKey(d.endDate)}`;
          if (payloadKeys.has(key)) continue;

          const activeBooking = await tx.reservation.findFirst({
            where: {
              tourDateId: d.id,
              deletedAt: null,
              status: { not: 'CANCELLED' },
            },
            select: { id: true },
          });
          if (activeBooking) {
            throw new BusinessException(
              'TOUR_DATE_HAS_BOOKINGS',
              'Rezervasyonu olan tarih formdan kaldırılamaz; önce ilgili seferi iptal edin',
            );
          }

          await tx.tourDateAgeRange.updateMany({
            where: { tourDateId: d.id, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          await tx.tourDate.update({
            where: { id: d.id },
            data: { deletedAt: new Date(), isActive: false },
          });
          existingKeys.delete(key);
        }

        for (const date of nestedDates) {
          const startDate = new Date(date.startDate);
          const endDate = new Date(date.endDate);
          const key = `${this.toDayKey(startDate)}|${this.toDayKey(endDate)}`;
          if (existingKeys.has(key)) continue;

          const createdDate = await tx.tourDate.create({
            data: {
              tourId,
              startDate,
              endDate,
              capacity: date.capacity,
              remainingCapacity: date.capacity,
              priceOverride:
                date.priceOverride !== undefined
                  ? new Prisma.Decimal(date.priceOverride)
                  : null,
            },
          });
          existingKeys.add(key);

          for (const range of date.ageRanges ?? []) {
            await tx.tourDateAgeRange.create({
              data: {
                tourDateId: createdDate.id,
                minAge: range.minAge,
                maxAge: range.maxAge ?? null,
                pricingType: range.pricingType,
                value: new Prisma.Decimal(range.value),
              },
            });
          }
        }
      }

      if (dto.replacePickupPoints === true) {
        await tx.tourPickupPoint.updateMany({
          where: { tourId, deletedAt: null },
          data: { deletedAt: new Date(), isActive: false },
        });
        for (const [index, point] of (dto.pickupPoints ?? []).entries()) {
          await tx.tourPickupPoint.create({
            data: {
              tourId,
              city: sanitizeTourPlainText(point.city, 100),
              location: sanitizeTourPlainText(point.location, 200),
              time: sanitizeTourPlainText(point.time, 20),
              description: point.description
                ? sanitizeTourPlainText(point.description, 500)
                : undefined,
              latitude: point.latitude ?? null,
              longitude: point.longitude ?? null,
              order: point.order ?? index,
            },
          });
        }
      }

      if (dto.accommodation) {
        const acc = {
          name: sanitizeTourPlainText(dto.accommodation.name, 200),
          image: dto.accommodation.image,
          location: sanitizeTourPlainText(dto.accommodation.location, 120),
          type: sanitizeTourPlainText(dto.accommodation.type, 80),
          rating: 0,
          features: [] as Prisma.InputJsonValue,
          deletedAt: null as Date | null,
        };
        await tx.tourAccommodation.upsert({
          where: { tourId },
          create: { tourId, ...acc },
          update: acc,
        });
      }

      return row;
    });

    await this.cache.del(`catalog:tour:${tourId}`);
    await this.cache.invalidatePattern('catalog:tours:search:*');
    await this.cache.del(`partner:dashboard:${tour.agencyId}`);

    return {
      success: true,
      data: this.toSharedTour(updated),
      error: null,
    };
  }

  async softDelete(
    tourId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    // Prefer cancelWithReason for published tours with bookings.
    // Soft-delete without reason still archives; no mass-cancel email.
    const tour = await this.findOwnedTour(tourId, agencyId, role);

    await this.prisma.tour.update({
      where: { id: tour.id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        ...(deletedBy ? { deletedBy } : {}),
      },
    });

    await this.cache.del(`catalog:tour:${tourId}`);
    await this.cache.invalidatePattern('catalog:tours:search:*');

    return {
      success: true,
      data: { id: tourId, deleted: true },
      error: null,
    };
  }

  /**
   * Partner cancels / delists a tour with a mandatory reason.
   * Emits tour.cancelled so booking cancels active reservations + emails guests.
   */
  async cancelWithReason(
    tourId: string,
    agencyId: string | undefined,
    role: string,
    reason: TourCancelReason,
    note?: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const reasonLabel = TOUR_CANCEL_REASON_LABELS[reason];

    const extras =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? { ...(tour.extras as Record<string, unknown>) }
        : {};

    await this.prisma.tour.update({
      where: { id: tour.id },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
        extras: {
          ...extras,
          cancelReason: reason,
          cancelReasonLabel: reasonLabel,
          cancelNote: note?.trim() || null,
          cancelledAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    await this.cache.del(`catalog:tour:${tourId}`);
    await this.cache.invalidatePattern('catalog:tours:search:*');
    await this.cache.del(`partner:dashboard:${tour.agencyId}`);

    this.eventEmitter.emit(
      'tour.cancelled',
      new TourCancelledEvent(
        tour.id,
        tour.agencyId,
        tour.title,
        reason,
        reasonLabel,
      ),
    );

    return {
      success: true,
      data: {
        id: tour.id,
        cancelled: true,
        reason,
        reasonLabel,
      },
      error: null,
    };
  }

  /**
   * Cancel selected departure dates. Bookings for those dates are cancelled via event.
   * Archives the tour only when no active dates remain.
   */
  async cancelDates(
    tourId: string,
    agencyId: string | undefined,
    role: string,
    dateIds: string[],
    reason: TourCancelReason,
    note?: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const uniqueIds = [...new Set(dateIds)];
    const reasonLabel = TOUR_CANCEL_REASON_LABELS[reason];

    const dates = await this.prisma.tourDate.findMany({
      where: {
        id: { in: uniqueIds },
        tourId: tour.id,
        deletedAt: null,
        isActive: true,
      },
    });

    if (dates.length === 0) {
      throw new BusinessException(
        'TOUR_DATES_NOT_FOUND',
        'Seçilen aktif tur tarihi bulunamadı',
      );
    }

    if (dates.length !== uniqueIds.length) {
      throw new BusinessException(
        'TOUR_DATES_INVALID',
        'Bazı tarihler bu tura ait değil veya zaten iptal edilmiş',
      );
    }

    const cancelledAt = new Date().toISOString();
    const cancelledInfos = dates.map((d) => ({
      id: d.id,
      startDate: d.startDate.toISOString(),
      endDate: d.endDate.toISOString(),
      label: formatTourDateLabel(d.startDate, d.endDate),
    }));

    await this.prisma.$transaction(async (tx) => {
      for (const date of dates) {
        await tx.tourDate.update({
          where: { id: date.id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });
      }

      const remaining = await tx.tourDate.count({
        where: {
          tourId: tour.id,
          deletedAt: null,
          isActive: true,
        },
      });

      if (remaining === 0) {
        const extras =
          tour.extras &&
          typeof tour.extras === 'object' &&
          !Array.isArray(tour.extras)
            ? { ...(tour.extras as Record<string, unknown>) }
            : {};

        await tx.tour.update({
          where: { id: tour.id },
          data: {
            status: 'ARCHIVED',
            deletedAt: new Date(),
            extras: {
              ...extras,
              cancelReason: reason,
              cancelReasonLabel: reasonLabel,
              cancelNote: note?.trim() || null,
              cancelledAt,
              cancelledDateIds: cancelledInfos.map((d) => d.id),
            } as Prisma.InputJsonValue,
          },
        });
      }
    });

    const remainingAfter = await this.prisma.tourDate.count({
      where: {
        tourId: tour.id,
        deletedAt: null,
        isActive: true,
      },
    });
    const tourArchived = remainingAfter === 0;

    await this.cache.del(`catalog:tour:${tourId}`);
    await this.cache.invalidatePattern('catalog:tours:search:*');
    await this.cache.del(`partner:dashboard:${tour.agencyId}`);

    this.eventEmitter.emit(
      'tour.dates.cancelled',
      new TourDatesCancelledEvent(
        tour.id,
        tour.agencyId,
        tour.title,
        cancelledInfos,
        reason,
        reasonLabel,
        tourArchived,
      ),
    );

    return {
      success: true,
      data: {
        id: tour.id,
        cancelledDateIds: cancelledInfos.map((d) => d.id),
        cancelledDates: cancelledInfos,
        reason,
        reasonLabel,
        tourArchived,
      },
      error: null,
    };
  }

  async getById(tourId: string) {
    const cacheKey = `catalog:tour:${tourId}`;
    const cached = await this.cache.get<SharedTour>(cacheKey);
    if (cached) {
      return { success: true, data: cached, error: null };
    }

    const tour = await this.prisma.tour.findFirst({
      where: {
        id: tourId,
        deletedAt: null,
        status: 'PUBLISHED',
      },
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

    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    const mapped = this.toSharedTour(tour);
    await this.cache.set(cacheKey, mapped, 900);

    return { success: true, data: mapped, error: null };
  }

  async search(dto: SearchToursDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_PAGE_LIMIT;
    const q = dto.q?.trim().toLowerCase() ?? '';
    const sortBy = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';
    const durationRange = this.resolveDurationFilter(dto);

    const departureCity = dto.departureCity
      ? normalizeDepartureCity(dto.departureCity)
      : null;

    const cacheKey = [
      'catalog:tours:search:v4',
      q,
      dto.agencyId ?? '',
      dto.category ?? '',
      dto.stayKind ?? '',
      dto.destinationScope ?? '',
      departureCity ?? '',
      dto.featured === true ? '1' : '0',
      durationRange?.min ?? '',
      durationRange?.max ?? '',
      dto.minPrice ?? '',
      dto.maxPrice ?? '',
      dto.minRating ?? '',
      sortBy,
      sortOrder,
      page,
      limit,
    ].join('|');

    const cached = await this.cache.get<{
      items: SharedTour[];
      meta: { page: number; limit: number; total: number };
    }>(cacheKey);

    if (cached) {
      this.eventEmitter.emit(
        'catalog.tour.search',
        new TourSearchPerformedEvent(q, dto.category, cached.meta.total, true),
      );
      return {
        success: true,
        data: cached.items,
        error: null,
        meta: cached.meta,
      };
    }

    const where: Prisma.TourWhereInput = {
      deletedAt: null,
      status: 'PUBLISHED',
      ...(dto.agencyId ? { agencyId: dto.agencyId } : {}),
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.stayKind ? { stayKind: dto.stayKind } : {}),
      ...(dto.destinationScope
        ? { destinationScope: dto.destinationScope }
        : {}),
      ...(departureCity ? { departureCities: { has: departureCity } } : {}),
      ...(dto.featured === true ? { featured: true } : {}),
      ...(durationRange
        ? {
            durationDays: {
              ...(durationRange.min !== undefined
                ? { gte: durationRange.min }
                : {}),
              ...(durationRange.max !== undefined
                ? { lte: durationRange.max }
                : {}),
            },
          }
        : {}),
      ...(dto.minPrice !== undefined || dto.maxPrice !== undefined
        ? {
            price: {
              ...(dto.minPrice !== undefined ? { gte: dto.minPrice } : {}),
              ...(dto.maxPrice !== undefined ? { lte: dto.maxPrice } : {}),
            },
          }
        : {}),
      ...(dto.minRating !== undefined
        ? { averageRating: { gte: dto.minRating } }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderByField =
      sortBy === 'price'
        ? 'price'
        : sortBy === 'rating'
          ? 'averageRating'
          : sortBy === 'durationDays'
            ? 'durationDays'
            : 'createdAt';

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.tour.count({ where }),
      this.prisma.tour.findMany({
        where,
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
    ]);

    const items = rows.map((row) => this.toSharedTour(row));
    const meta = { page, limit, total };

    await this.cache.set(cacheKey, { items, meta }, SEARCH_CACHE_TTL_SECONDS);

    this.eventEmitter.emit(
      'catalog.tour.search',
      new TourSearchPerformedEvent(q, dto.category, total, false),
    );

    return {
      success: true,
      data: items,
      error: null,
      meta,
    };
  }

  /** Shared Tag → related published tours (Post/Tag RelatedTours hikâyesi). */
  async listRelatedTours(tourId: string, limit = 6) {
    const tags = await this.prisma.tourTag.findMany({
      where: { tourId },
      select: { tagId: true },
    });

    if (tags.length === 0) {
      return { success: true, data: [], error: null };
    }

    const tagIds = tags.map((row) => row.tagId);
    const relatedLinks = await this.prisma.tourTag.findMany({
      where: {
        tagId: { in: tagIds },
        tourId: { not: tourId },
        tour: { status: 'PUBLISHED', deletedAt: null },
      },
      select: { tourId: true },
    });

    const counts = new Map<string, number>();
    for (const link of relatedLinks) {
      counts.set(link.tourId, (counts.get(link.tourId) ?? 0) + 1);
    }

    const ranked = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(Math.max(limit, 1), 20))
      .map(([id]) => id);

    if (ranked.length === 0) {
      return { success: true, data: [], error: null };
    }

    const tours = await this.prisma.tour.findMany({
      where: { id: { in: ranked }, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        price: true,
        currency: true,
        averageRating: true,
        reviewCount: true,
        category: true,
      },
    });

    const byId = new Map(tours.map((tour) => [tour.id, tour]));
    const data = ranked
      .map((id) => byId.get(id))
      .filter((tour): tour is NonNullable<typeof tour> => !!tour)
      .map((tour) => ({
        ...tour,
        price: tour.price.toString(),
        averageRating: tour.averageRating.toString(),
      }));

    return { success: true, data, error: null };
  }

  async createTourDate(
    tourId: string,
    dto: CreateTourDateDto,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwnedTour(tourId, agencyId, role);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new BusinessException(
        'INVALID_DATE_RANGE',
        'Bitiş tarihi başlangıçtan önce olamaz',
      );
    }

    // Heal accidental duplicates from older create-on-update bugs (booking-safe).
    await this.quietDedupeTourDates(tourId);

    const existing = await this.prisma.tourDate.findMany({
      where: {
        tourId,
        deletedAt: null,
        isActive: true,
        startDate,
        endDate,
      },
      orderBy: [{ remainingCapacity: 'asc' }, { createdAt: 'asc' }],
    });

    // Idempotent: same window already active → reuse (no second row, checkout IDs stay).
    if (existing.length > 0) {
      return {
        success: true,
        data: this.toSharedTourDate(existing[0]),
        error: null,
      };
    }

    const tourDate = await this.prisma.tourDate.create({
      data: {
        tourId,
        startDate,
        endDate,
        capacity: dto.capacity,
        remainingCapacity: dto.capacity,
        priceOverride:
          dto.priceOverride !== undefined
            ? new Prisma.Decimal(dto.priceOverride)
            : null,
      },
    });

    return {
      success: true,
      data: this.toSharedTourDate(tourDate),
      error: null,
    };
  }

  async listTourDates(tourId: string) {
    // Public catalog: only PUBLISHED tours expose departure windows (IDOR).
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null, status: 'PUBLISHED' },
      select: { id: true },
    });

    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    // Self-heal unused duplicate windows without cancelling bookings.
    await this.quietDedupeTourDates(tourId);

    const dates = await this.prisma.tourDate.findMany({
      where: { tourId, deletedAt: null, isActive: true },
      select: {
        id: true,
        tourId: true,
        startDate: true,
        endDate: true,
        capacity: true,
        remainingCapacity: true,
        priceOverride: true,
        isActive: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      success: true,
      data: dates.map((d) => this.toSharedTourDate(d)),
      error: null,
    };
  }

  /**
   * Soft-deactivate unused duplicate date windows.
   * Keeps the row with lowest remainingCapacity (likely has bookings).
   * Never emits tour.dates.cancelled — reservations / checkout stay intact.
   */
  async quietDedupeTourDates(tourId: string): Promise<number> {
    const dates = await this.prisma.tourDate.findMany({
      where: { tourId, deletedAt: null, isActive: true },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    });

    const groups = new Map<string, typeof dates>();
    for (const date of dates) {
      const key = `${this.toDayKey(date.startDate)}|${this.toDayKey(date.endDate)}`;
      const group = groups.get(key) ?? [];
      group.push(date);
      groups.set(key, group);
    }

    const toDeactivate: string[] = [];
    for (const group of groups.values()) {
      if (group.length < 2) continue;

      const sorted = [...group].sort((a, b) => {
        if (a.remainingCapacity !== b.remainingCapacity) {
          return a.remainingCapacity - b.remainingCapacity;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      for (const duplicate of sorted.slice(1)) {
        // Seats already sold → leave alone (reservation.tourDateId may point here).
        if (duplicate.remainingCapacity < duplicate.capacity) continue;
        toDeactivate.push(duplicate.id);
      }
    }

    if (toDeactivate.length === 0) return 0;

    await this.prisma.tourDate.updateMany({
      where: { id: { in: toDeactivate } },
      data: { isActive: false, deletedAt: new Date() },
    });

    await this.cache.del(`catalog:tour:${tourId}`);
    await this.cache.invalidatePattern('catalog:tours:search:*');

    return toDeactivate.length;
  }

  private toDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private async ensurePartnerCanPublish(agencyId: string): Promise<void> {
    const partner = await this.prisma.agency.findFirst({
      where: { id: agencyId, deletedAt: null },
    });

    if (!partner) {
      throw new ForbiddenException({
        code: 'PARTNER_NOT_FOUND',
        message: 'Partner bulunamadı',
      });
    }

    if (partner.status !== 'VERIFIED') {
      throw new ForbiddenException({
        code: 'PARTNER_NOT_VERIFIED',
        message: 'Tur oluşturmak için partner hesabı doğrulanmış olmalı',
      });
    }
  }

  /**
   * PUBLISHED gate: marketplace Agency VKN + unvan + adres zorunlu.
   * Expand: agencyId yoksa Partner taxNumber + address ile geçici kontrol.
   */
  private async ensureTourCanBePublished(tour: {
    agencyId: string;
  }): Promise<void> {
    const agency = await this.prisma.agency.findFirst({
      where: { id: tour.agencyId, deletedAt: null },
    });
    if (
      !agency ||
      !agency.taxNumber?.trim() ||
      !agency.legalTitle?.trim() ||
      !agency.address?.trim()
    ) {
      throw new ForbiddenException({
        code: 'AGENCY_INVOICE_FIELDS_REQUIRED',
        message: 'Tur yayınlamak için acente VKN, unvan ve adres zorunludur',
      });
    }
  }

  private async findOwnedTour(
    tourId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
    });

    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    this.agencyLink.assertSellerOwner(
      { agencyId: tour.agencyId },
      { agencyId, role },
      'Bu tura erişim yetkiniz yok',
    );

    return tour;
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let candidate = base;
    let suffix = 0;

    while (true) {
      const existing = await this.prisma.tour.findFirst({
        where: {
          slug: candidate,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });

      if (!existing) {
        return candidate;
      }

      suffix += 1;
      candidate = `${base}-${suffix}`.slice(0, 220);
    }
  }

  private resolveDurationFilter(dto: SearchToursDto): {
    min?: number;
    max?: number;
  } | null {
    if (dto.durationDays !== undefined) {
      return { min: dto.durationDays, max: dto.durationDays };
    }
    switch (dto.duration) {
      case '1':
        return { min: 1, max: 1 };
      case '2-3':
        return { min: 2, max: 3 };
      case '4-6':
        return { min: 4, max: 6 };
      case '7+':
        return { min: 7 };
      default:
        return null;
    }
  }

  private toSharedTour(tour: {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverUrl: string | null;
    galleryUrls?: string[];
    extras?: Prisma.JsonValue;
    price: Prisma.Decimal;
    currency: string;
    category: string;
    status: string;
    durationDays: number;
    stayKind?: string;
    destinationScope?: string;
    departureCities?: string[];
    featured?: boolean | null;
    averageRating?: Prisma.Decimal | null;
    reviewCount?: number | null;
    agencyId: string;
    createdAt: Date;
    updatedAt: Date;
    agency?: {
      id: string;
      companyName: string;
      logo: string | null;
      sellerTier: string;
      averageRating: Prisma.Decimal;
      reviewCount: number;
    } | null;
  }): SharedTour {
    return {
      id: tour.id,
      title: tour.title,
      slug: tour.slug,
      description: tour.description,
      coverUrl: this.storage.resolvePublicUrl(tour.coverUrl),
      galleryUrls: this.storage.resolvePublicUrlList(tour.galleryUrls ?? []),
      extras:
        tour.extras &&
        typeof tour.extras === 'object' &&
        !Array.isArray(tour.extras)
          ? (tour.extras as Record<string, unknown>)
          : {},
      price: tour.price.toString(),
      currency: tour.currency,
      category: tour.category as SharedTour['category'],
      status: tour.status as SharedTour['status'],
      durationDays: tour.durationDays,
      stayKind: (tour.stayKind as SharedTour['stayKind']) ?? 'OVERNIGHT',
      destinationScope:
        (tour.destinationScope as SharedTour['destinationScope']) ?? 'DOMESTIC',
      departureCities: tour.departureCities ?? [],
      featured: tour.featured ?? false,
      averageRating: (tour.averageRating ?? new Prisma.Decimal(0)).toString(),
      reviewCount: tour.reviewCount ?? 0,
      partnerId: tour.agencyId,
      agencyId: tour.agencyId,
      partner: tour.agency
        ? {
            id: tour.agency.id,
            companyName: tour.agency.companyName,
            logo: this.storage.resolvePublicUrl(tour.agency.logo),
            membershipTier: tour.agency.sellerTier as
              'BRONZE' | 'SILVER' | 'GOLD',
            averageRating: tour.agency.averageRating.toString(),
            reviewCount: tour.agency.reviewCount,
          }
        : undefined,
      createdAt: tour.createdAt.toISOString(),
      updatedAt: tour.updatedAt.toISOString(),
    };
  }

  private toSharedTourDate(date: {
    id: string;
    tourId: string;
    startDate: Date;
    endDate: Date;
    capacity: number;
    remainingCapacity: number;
    priceOverride: Prisma.Decimal | null;
    isActive: boolean;
  }): SharedTourDate {
    return {
      id: date.id,
      tourId: date.tourId,
      startDate: date.startDate.toISOString().slice(0, 10),
      endDate: date.endDate.toISOString().slice(0, 10),
      capacity: date.capacity,
      remainingCapacity: date.remainingCapacity,
      priceOverride: date.priceOverride?.toString() ?? null,
      isActive: date.isActive,
    };
  }
}
