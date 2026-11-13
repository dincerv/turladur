import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../../generated/prisma';

import { CacheService } from '../../../core/cache/cache.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { StorageService } from '../../../core/storage/storage.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import {
  sanitizeTourExtras,
  sanitizeTourPlainText,
} from '../../catalog/utils/sanitize-tour-text';

const DASHBOARD_CACHE_TTL_SECONDS = 60;

type DashboardActor = { userId: string; role: string };

type DashboardCachePayload = {
  tours: {
    total: number;
    published: number;
    pendingReview: number;
  };
  reservations: {
    total: number;
    byStatus: {
      pending: number;
      confirmed: number;
      cancelled: number;
      completed: number;
    };
  };
  revenue: { confirmedTotal: string; currency: string };
  months: Array<{ month: string; total: string }>;
  recentReservations: Array<{
    id: string;
    bookingNumber: string;
    tourId: string | null;
    tourTitle: string | null;
    status: string;
    totalAmount: string;
    currency: string;
    contactEmail: string;
    customerName: string;
    createdAt: string;
  }>;
  popularTours: Array<{
    id: string;
    title: string;
    category: string;
    price: string;
    currency: string;
    coverUrl: string | null;
    reservationCount: number;
    guestCount: number;
    rating: number;
    reviewCount: number;
  }>;
};

type ReportDateRangeId =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'lastYear'
  | 'custom';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function resolveReportDateRange(id: ReportDateRangeId, now = new Date()) {
  const today = startOfDay(now);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const ranges: Record<
    ReportDateRangeId,
    {
      label: string;
      start: Date;
      end: Date;
      previousStart: Date;
      previousEnd: Date;
    }
  > = {
    today: {
      label: 'Bugün',
      start: today,
      end: endOfToday,
      previousStart: addDays(today, -1),
      previousEnd: new Date(addDays(today, -1).setHours(23, 59, 59, 999)),
    },
    yesterday: {
      label: 'Dün',
      start: addDays(today, -1),
      end: new Date(addDays(today, -1).setHours(23, 59, 59, 999)),
      previousStart: addDays(today, -2),
      previousEnd: new Date(addDays(today, -2).setHours(23, 59, 59, 999)),
    },
    thisWeek: {
      label: 'Bu Hafta',
      start: addDays(today, -today.getDay() + 1),
      end: endOfToday,
      previousStart: addDays(addDays(today, -today.getDay() + 1), -7),
      previousEnd: addDays(addDays(today, -today.getDay()), -1),
    },
    lastWeek: {
      label: 'Geçen Hafta',
      start: addDays(addDays(today, -today.getDay() + 1), -7),
      end: addDays(addDays(today, -today.getDay()), -1),
      previousStart: addDays(addDays(today, -today.getDay() + 1), -14),
      previousEnd: addDays(addDays(today, -today.getDay()), -8),
    },
    thisMonth: {
      label: 'Bu Ay',
      start: startOfMonth(today),
      end: endOfToday,
      previousStart: startOfMonth(addMonths(today, -1)),
      previousEnd: endOfMonth(addMonths(today, -1)),
    },
    lastMonth: {
      label: 'Geçen Ay',
      start: startOfMonth(addMonths(today, -1)),
      end: endOfMonth(addMonths(today, -1)),
      previousStart: startOfMonth(addMonths(today, -2)),
      previousEnd: endOfMonth(addMonths(today, -2)),
    },
    last3Months: {
      label: 'Son 3 Ay',
      start: startOfMonth(addMonths(today, -2)),
      end: endOfToday,
      previousStart: startOfMonth(addMonths(today, -5)),
      previousEnd: endOfMonth(addMonths(today, -3)),
    },
    lastYear: {
      label: 'Geçen Yıl',
      start: new Date(today.getFullYear() - 1, 0, 1),
      end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      previousStart: new Date(today.getFullYear() - 2, 0, 1),
      previousEnd: new Date(today.getFullYear() - 2, 11, 31, 23, 59, 59, 999),
    },
    custom: {
      label: 'Özel Tarih Aralığı',
      start: startOfMonth(addMonths(today, -1)),
      end: endOfMonth(addMonths(today, -1)),
      previousStart: startOfMonth(addMonths(today, -2)),
      previousEnd: endOfMonth(addMonths(today, -2)),
    },
  };

  return { id, ...ranges[id] };
}

@Injectable()
export class PartnerService {
  private readonly logger = new Logger(PartnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storage: StorageService,
    private readonly cache: CacheService,
  ) {}

  async getDashboardStats(
    agencyId: string | undefined,
    actor?: DashboardActor,
  ) {
    this.requireAgencyId(agencyId);

    const access = await this.resolveDashboardAccess(actor);
    const payload = await this.loadDashboardPayload(agencyId);

    return {
      success: true,
      data: {
        tours: access.canSeeTours ? payload.tours : null,
        reservations: access.canSeeReservations
          ? {
              total: payload.reservations.total,
              byStatus: payload.reservations.byStatus,
            }
          : null,
        revenue: access.canSeeRevenue ? payload.revenue : null,
        months: access.canSeeRevenue ? payload.months : null,
        recentReservations: access.canSeeReservations
          ? payload.recentReservations
          : null,
        popularTours: access.canSeeTours ? payload.popularTours : null,
      },
      error: null,
    };
  }

  private async loadDashboardPayload(
    agencyId: string,
  ): Promise<DashboardCachePayload> {
    const cacheKey = `partner:dashboard:${agencyId}`;
    try {
      const cached = await this.cache.get<DashboardCachePayload>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(
        `Dashboard cache read failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [
      tourStatusGroups,
      reservationStatusGroups,
      revenueAgg,
      monthRows,
      recentRows,
      reservationByTour,
    ] = await Promise.all([
      this.prisma.tour.groupBy({
        by: ['status'],
        where: { agencyId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: { agencyId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.reservation.aggregate({
        where: {
          agencyId,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.reservation.findMany({
        where: {
          agencyId,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          createdAt: { gte: since },
        },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.reservation.findMany({
        where: { agencyId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          bookingNumber: true,
          tourId: true,
          experienceId: true,
          status: true,
          totalAmount: true,
          currency: true,
          contactEmail: true,
          guests: true,
          createdAt: true,
        },
      }),
      this.prisma.reservation.groupBy({
        by: ['tourId'],
        where: {
          agencyId,
          deletedAt: null,
          tourId: { not: null },
          status: {
            in: ['CONFIRMED', 'COMPLETED', 'PENDING', 'PENDING_PAYMENT'],
          },
        },
        _count: { _all: true },
        _sum: { adults: true, children: true },
      }),
    ]);

    const tourCounts = { total: 0, published: 0, pendingReview: 0 };
    for (const row of tourStatusGroups) {
      tourCounts.total += row._count._all;
      if (row.status === 'PUBLISHED') tourCounts.published = row._count._all;
      if (row.status === 'PENDING_REVIEW') {
        tourCounts.pendingReview = row._count._all;
      }
    }

    const byStatus = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };
    let reservationTotal = 0;
    for (const row of reservationStatusGroups) {
      reservationTotal += row._count._all;
      if (row.status === 'CONFIRMED') byStatus.confirmed = row._count._all;
      else if (row.status === 'CANCELLED') byStatus.cancelled = row._count._all;
      else if (row.status === 'COMPLETED') byStatus.completed = row._count._all;
      else byStatus.pending += row._count._all;
    }

    const byMonth = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(since);
      d.setMonth(since.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }
    for (const row of monthRows) {
      const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(row.totalAmount));
    }
    const months = [...byMonth.entries()].map(([month, total]) => ({
      month,
      total: total.toFixed(2),
    }));

    const topTourGroups = [...reservationByTour]
      .sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0))
      .slice(0, 4);

    const titleIds = {
      tourIds: [
        ...new Set(
          [
            ...recentRows.map((r) => r.tourId),
            ...topTourGroups.map((r) => r.tourId),
          ].filter((id): id is string => Boolean(id)),
        ),
      ],
      experienceIds: [
        ...new Set(
          recentRows
            .map((r) => r.experienceId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
    };

    const [tours, experiences] = await Promise.all([
      titleIds.tourIds.length
        ? this.prisma.tour.findMany({
            where: { id: { in: titleIds.tourIds }, agencyId, deletedAt: null },
            select: {
              id: true,
              title: true,
              category: true,
              price: true,
              currency: true,
              coverUrl: true,
              averageRating: true,
              reviewCount: true,
            },
          })
        : Promise.resolve([]),
      titleIds.experienceIds.length
        ? this.prisma.experience.findMany({
            where: {
              id: { in: titleIds.experienceIds },
              deletedAt: null,
            },
            select: { id: true, title: true },
          })
        : Promise.resolve([]),
    ]);

    const tourById = new Map(tours.map((t) => [t.id, t]));
    const experienceTitleById = new Map(
      experiences.map((e) => [e.id, e.title]),
    );

    const recentReservations = recentRows.map((row) => {
      const guests = Array.isArray(row.guests)
        ? (row.guests as Array<{ firstName?: string; lastName?: string }>)
        : [];
      const primary = guests[0];
      const customerName = primary
        ? `${primary.firstName ?? ''} ${primary.lastName ?? ''}`.trim()
        : row.contactEmail;
      const tourTitle = row.tourId
        ? (tourById.get(row.tourId)?.title ?? null)
        : row.experienceId
          ? (experienceTitleById.get(row.experienceId) ?? null)
          : null;
      return {
        id: row.id,
        bookingNumber: row.bookingNumber,
        tourId: row.tourId,
        tourTitle,
        status: row.status,
        totalAmount: row.totalAmount.toString(),
        currency: row.currency,
        contactEmail: row.contactEmail,
        customerName,
        createdAt: row.createdAt.toISOString(),
      };
    });

    const popularTours = topTourGroups
      .map((row) => {
        if (!row.tourId) return null;
        const tour = tourById.get(row.tourId);
        if (!tour) return null;
        return {
          id: tour.id,
          title: tour.title,
          category: String(tour.category),
          price: tour.price.toString(),
          currency: tour.currency,
          coverUrl: this.storage.resolvePublicUrl(tour.coverUrl),
          reservationCount: row._count?._all ?? 0,
          guestCount: (row._sum?.adults ?? 0) + (row._sum?.children ?? 0),
          rating: Number(tour.averageRating) || 0,
          reviewCount: tour.reviewCount ?? 0,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    // Fallback: published tours with zero bookings still surface in empty agencies.
    if (popularTours.length === 0) {
      const fallback = await this.prisma.tour.findMany({
        where: { agencyId, deletedAt: null },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
        take: 4,
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          currency: true,
          coverUrl: true,
          averageRating: true,
          reviewCount: true,
        },
      });
      for (const tour of fallback) {
        popularTours.push({
          id: tour.id,
          title: tour.title,
          category: String(tour.category),
          price: tour.price.toString(),
          currency: tour.currency,
          coverUrl: this.storage.resolvePublicUrl(tour.coverUrl),
          reservationCount: 0,
          guestCount: 0,
          rating: Number(tour.averageRating) || 0,
          reviewCount: tour.reviewCount ?? 0,
        });
      }
    }

    const payload: DashboardCachePayload = {
      tours: tourCounts,
      reservations: { total: reservationTotal, byStatus },
      revenue: {
        confirmedTotal: revenueAgg._sum.totalAmount?.toString() ?? '0',
        currency: 'TRY',
      },
      months,
      recentReservations,
      popularTours,
    };

    try {
      await this.cache.set(cacheKey, payload, DASHBOARD_CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(
        `Dashboard cache write failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    return payload;
  }

  private async resolveDashboardAccess(actor?: DashboardActor): Promise<{
    canSeeRevenue: boolean;
    canSeeReservations: boolean;
    canSeeTours: boolean;
  }> {
    if (!actor) {
      return {
        canSeeRevenue: true,
        canSeeReservations: true,
        canSeeTours: true,
      };
    }
    if (
      actor.role === 'PARTNER' ||
      actor.role === 'AGENCY_OWNER' ||
      actor.role === 'AGENCY_ADMIN' ||
      actor.role === 'ADMIN' ||
      actor.role === 'SUPER_ADMIN' ||
      actor.role === 'PLATFORM_ADMIN' ||
      actor.role === 'PLATFORM_OPERATOR'
    ) {
      return {
        canSeeRevenue: true,
        canSeeReservations: true,
        canSeeTours: true,
      };
    }
    if (actor.role !== 'PARTNER_STAFF' && actor.role !== 'AGENCY_STAFF') {
      return {
        canSeeRevenue: false,
        canSeeReservations: false,
        canSeeTours: false,
      };
    }

    const staff = await this.prisma.agencyStaff.findFirst({
      where: { id: actor.userId, deletedAt: null },
      select: { permissions: true, agencyId: true },
    });
    const permissions = staff?.permissions;
    if (
      !permissions ||
      typeof permissions !== 'object' ||
      Array.isArray(permissions)
    ) {
      return {
        canSeeRevenue: false,
        canSeeReservations: false,
        canSeeTours: false,
      };
    }
    const map = permissions as Record<string, unknown>;
    const has = (key: string) => {
      const value = map[key];
      if (value === true) return true;
      if (Array.isArray(value) && value.length > 0) return true;
      return false;
    };
    return {
      canSeeRevenue: has('reports'),
      canSeeReservations: has('reservations') || has('customers'),
      canSeeTours: has('tours'),
    };
  }

  private async invalidateDashboardCache(agencyId: string): Promise<void> {
    try {
      await this.cache.del(`partner:dashboard:${agencyId}`);
    } catch (err) {
      this.logger.warn(
        `Dashboard cache invalidate failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  async listTours(
    agencyId: string | undefined,
    options?: {
      q?: string;
      status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
      page?: number;
      pageSize?: number;
    },
  ) {
    this.requireAgencyId(agencyId);

    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 12));
    const rawQ = (options?.q ?? '').trim().slice(0, 80);
    // Strip control chars — never interpolate raw user input into HTML later.
    const q = rawQ.replace(/[\u0000-\u001F\u007F]/g, '');

    const where: Prisma.TourWhereInput = {
      agencyId,
      deletedAt: null,
      ...(options?.status ? { status: options.status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              // category is enum — exact match only when query looks like one
            ],
          }
        : {}),
    };

    if (q) {
      const categories = [
        'CULTURAL',
        'ADVENTURE',
        'GASTRONOMY',
        'NATURE',
        'CITY',
        'BEACH',
      ] as const;
      const categoryMatch = categories.find(
        (c) => c.toLowerCase() === q.toLowerCase(),
      );
      if (categoryMatch) {
        where.OR = [
          ...(Array.isArray(where.OR) ? where.OR : []),
          { category: categoryMatch },
        ];
      }
    }

    const [total, tours] = await Promise.all([
      this.prisma.tour.count({ where }),
      this.prisma.tour.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          currency: true,
          category: true,
          status: true,
          coverUrl: true,
          durationDays: true,
          averageRating: true,
          reviewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: true,
      data: {
        items: tours.map((tour) => ({
          id: tour.id,
          title: tour.title,
          slug: tour.slug,
          price: tour.price.toString(),
          currency: tour.currency,
          category: tour.category,
          status: tour.status,
          coverUrl: this.storage.resolvePublicUrl(tour.coverUrl),
          durationDays: tour.durationDays,
          averageRating: Number(tour.averageRating) || 0,
          reviewCount: tour.reviewCount ?? 0,
          createdAt: tour.createdAt.toISOString(),
          updatedAt: tour.updatedAt.toISOString(),
        })),
        meta: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
      error: null,
    };
  }

  /**
   * Single round-trip bootstrap for /acente/tours/:id/edit.
   * Ownership enforced via agencyId filter.
   */
  async getTourEditBundle(agencyId: string | undefined, tourId: string) {
    this.requireAgencyId(agencyId);

    const detail = await this.getTourDetail(agencyId, tourId);
    const datesResult = await this.listOwnedTourDates(agencyId, tourId);
    const dates = datesResult.data;

    const dateIds = dates.map((d) => d.id);
    const ageRanges = dateIds.length
      ? await this.prisma.tourDateAgeRange.findMany({
          where: { tourDateId: { in: dateIds }, deletedAt: null },
          select: {
            id: true,
            tourDateId: true,
            minAge: true,
            maxAge: true,
            pricingType: true,
            value: true,
          },
          orderBy: { minAge: 'asc' },
        })
      : [];

    const pickups = await this.prisma.tourPickupPoint.findMany({
      where: { tourId, deletedAt: null, isActive: true },
      select: {
        id: true,
        tourId: true,
        city: true,
        location: true,
        time: true,
        description: true,
        latitude: true,
        longitude: true,
        order: true,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    const accommodation = await this.prisma.tourAccommodation.findFirst({
      where: { tourId, deletedAt: null },
      select: {
        id: true,
        tourId: true,
        name: true,
        image: true,
        location: true,
        type: true,
        rating: true,
        features: true,
        description: true,
      },
    });

    const ageByDate = new Map<string, typeof ageRanges>();
    for (const row of ageRanges) {
      const list = ageByDate.get(row.tourDateId) ?? [];
      list.push(row);
      ageByDate.set(row.tourDateId, list);
    }

    return {
      success: true,
      data: {
        tour: detail.data,
        dates: dates.map((d) => ({
          ...d,
          ageRanges: (ageByDate.get(d.id) ?? []).map((r) => ({
            id: r.id,
            minAge: r.minAge,
            maxAge: r.maxAge,
            pricingType: r.pricingType,
            value: r.value.toString(),
          })),
        })),
        pickupPoints: pickups.map((p) => ({
          id: p.id,
          tourId: p.tourId,
          city: p.city,
          location: p.location,
          time: p.time,
          description: p.description,
          latitude: p.latitude,
          longitude: p.longitude,
          order: p.order,
          isActive: p.isActive,
        })),
        accommodation: accommodation
          ? {
              id: accommodation.id,
              tourId: accommodation.tourId,
              name: accommodation.name,
              image: this.storage.resolvePublicUrl(accommodation.image),
              location: accommodation.location,
              type: accommodation.type,
              rating: accommodation.rating,
              features: accommodation.features,
              description: accommodation.description,
            }
          : null,
      },
      error: null,
    };
  }

  /**
   * Owned departure dates for agency panel (all tour statuses).
   * Public `/catalog/tours/:id/dates` only returns PUBLISHED tours.
   */
  async listOwnedTourDates(agencyId: string | undefined, tourId: string) {
    this.requireAgencyId(agencyId);

    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, agencyId, deletedAt: null },
      select: { id: true },
    });

    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

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
      data: dates.map((d) => ({
        id: d.id,
        tourId: d.tourId,
        startDate: d.startDate.toISOString().slice(0, 10),
        endDate: d.endDate.toISOString().slice(0, 10),
        capacity: d.capacity,
        remainingCapacity: d.remainingCapacity,
        priceOverride: d.priceOverride?.toString() ?? null,
        isActive: d.isActive,
      })),
      error: null,
    };
  }

  async getTourDetail(agencyId: string | undefined, tourId: string) {
    this.requireAgencyId(agencyId);

    const baseSelect = {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverUrl: true,
      price: true,
      currency: true,
      category: true,
      status: true,
      durationDays: true,
      agencyId: true,
      createdAt: true,
      updatedAt: true,
      agency: {
        select: {
          id: true,
          companyName: true,
          logo: true,
        },
      },
    } as const;

    let tour: {
      id: string;
      title: string;
      slug: string;
      description: string;
      coverUrl: string | null;
      price: { toString(): string };
      currency: string;
      category: string;
      status: string;
      durationDays: number;
      stayKind?: string;
      destinationScope?: string;
      departureCities?: string[];
      agencyId: string;
      createdAt: Date;
      updatedAt: Date;
      galleryUrls?: string[];
      extras?: unknown;
      agency: {
        id: string;
        companyName: string;
        logo: string | null;
      };
    } | null = null;

    try {
      tour = await this.prisma.tour.findFirst({
        where: { id: tourId, agencyId, deletedAt: null },
        select: {
          ...baseSelect,
          galleryUrls: true,
          extras: true,
          stayKind: true,
          destinationScope: true,
          departureCities: true,
        },
      });
    } catch {
      // galleryUrls/extras migration henüz uygulanmamış olabilir
      tour = await this.prisma.tour.findFirst({
        where: { id: tourId, agencyId, deletedAt: null },
        select: baseSelect,
      });
    }

    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    const rawExtras =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? (tour.extras as Record<string, unknown>)
        : {};
    const extras = sanitizeTourExtras(rawExtras);

    return {
      success: true,
      data: {
        id: tour.id,
        title: sanitizeTourPlainText(tour.title, 200),
        slug: tour.slug,
        description: sanitizeTourPlainText(tour.description, 20_000),
        coverUrl: this.storage.resolvePublicUrl(tour.coverUrl),
        galleryUrls: this.storage.resolvePublicUrlList(tour.galleryUrls ?? []),
        extras,
        price: tour.price.toString(),
        currency: tour.currency,
        category: tour.category,
        status: tour.status,
        durationDays: tour.durationDays,
        stayKind: tour.stayKind,
        destinationScope: tour.destinationScope,
        departureCities: tour.departureCities ?? [],
        agencyId: tour.agencyId,
        agency: tour.agency,
        createdAt: tour.createdAt.toISOString(),
        updatedAt: tour.updatedAt.toISOString(),
      },
      error: null,
    };
  }

  async listExperiences(
    agencyId: string | undefined,
    options?: {
      q?: string;
      status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
      category?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    this.requireAgencyId(agencyId);

    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 12));
    const rawQ = (options?.q ?? '').trim().slice(0, 80);
    const q = rawQ.replace(/[\u0000-\u001F\u007F]/g, '');
    const category = (options?.category ?? '')
      .trim()
      .slice(0, 120)
      .replace(/[\u0000-\u001F\u007F]/g, '');

    const where: Prisma.ExperienceWhereInput = {
      agencyId,
      deletedAt: null,
      ...(options?.status ? { status: options.status } : {}),
      ...(category
        ? { category: { contains: category, mode: 'insensitive' } }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { category: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, experiences] = await Promise.all([
      this.prisma.experience.count({ where }),
      this.prisma.experience.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          location: true,
          price: true,
          currency: true,
          status: true,
          imageUrl: true,
          duration: true,
          ageRestriction: true,
          averageRating: true,
          reviewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: true,
      data: {
        items: experiences.map((experience) => ({
          id: experience.id,
          title: experience.title,
          slug: experience.slug,
          category: experience.category,
          location: experience.location,
          price: experience.price.toString(),
          currency: experience.currency,
          status: experience.status,
          imageUrl: this.storage.resolvePublicUrl(experience.imageUrl),
          duration: experience.duration,
          ageRestriction: experience.ageRestriction,
          averageRating: experience.averageRating.toString(),
          reviewCount: experience.reviewCount,
          createdAt: experience.createdAt.toISOString(),
          updatedAt: experience.updatedAt.toISOString(),
        })),
        meta: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
      error: null,
    };
  }

  /**
   * Edit bootstrap for /acente/experiences/:id/edit.
   * Ownership via agencyId — never trust URL id alone.
   */
  async getExperienceEditBundle(
    agencyId: string | undefined,
    experienceId: string,
  ) {
    this.requireAgencyId(agencyId);

    const experience = await this.prisma.experience.findFirst({
      where: { id: experienceId, agencyId, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        longDescription: true,
        category: true,
        location: true,
        duration: true,
        price: true,
        currency: true,
        status: true,
        imageUrl: true,
        gallery: true,
        included: true,
        notIncluded: true,
        highlights: true,
        meetingPoint: true,
        ageRestriction: true,
        averageRating: true,
        reviewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!experience) {
      throw new NotFoundException({
        code: 'EXPERIENCE_NOT_FOUND',
        message: 'Deneyim bulunamadı veya erişim yetkiniz yok',
      });
    }

    const dates = await this.prisma.activityDate.findMany({
      where: { experienceId, deletedAt: null },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        price: true,
        availableSeats: true,
        remainingCapacity: true,
        isActive: true,
      },
    });

    const toStringList = (value: unknown): string[] => {
      if (!Array.isArray(value)) return [];
      return value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean);
    };

    return {
      success: true,
      data: {
        experience: {
          id: experience.id,
          title: experience.title,
          slug: experience.slug,
          description: experience.description,
          longDescription: experience.longDescription,
          category: experience.category,
          location: experience.location,
          duration: experience.duration,
          price: experience.price.toString(),
          currency: experience.currency,
          status: experience.status,
          imageUrl: this.storage.resolvePublicUrl(experience.imageUrl),
          gallery: toStringList(experience.gallery).map(
            (url) => this.storage.resolvePublicUrl(url) ?? url,
          ),
          included: toStringList(experience.included),
          notIncluded: toStringList(experience.notIncluded),
          highlights: toStringList(experience.highlights),
          meetingPoint: experience.meetingPoint,
          ageRestriction: experience.ageRestriction,
          averageRating: experience.averageRating.toString(),
          reviewCount: experience.reviewCount,
          createdAt: experience.createdAt.toISOString(),
          updatedAt: experience.updatedAt.toISOString(),
        },
        dates: dates.map((d) => ({
          id: d.id,
          startDate: d.startDate.toISOString().slice(0, 10),
          endDate: d.endDate.toISOString().slice(0, 10),
          price: d.price.toString(),
          availableSeats: d.availableSeats,
          remainingCapacity: d.remainingCapacity,
          isActive: d.isActive,
        })),
      },
      error: null,
    };
  }

  async getProfile(agencyId: string | undefined) {
    this.requireAgencyId(agencyId);
    const agency = await this.prisma.agency.findFirst({
      where: { id: agencyId, deletedAt: null },
    });
    if (!agency) {
      throw new NotFoundException({
        code: 'AGENCY_NOT_FOUND',
        message: 'Acente bulunamadı',
      });
    }
    return {
      success: true,
      data: {
        id: agency.id,
        companyName: agency.companyName,
        taxNumber: agency.taxNumber,
        contactEmail: agency.contactEmail,
        contactPhone: agency.contactPhone,
        status: agency.status,
        capabilities: agency.capabilities,
        sellerTier: agency.sellerTier,
        address: agency.address,
        city: agency.city,
        country: agency.country,
        website: agency.website,
        logo: this.storage.resolvePublicUrl(agency.logo),
        averageRating: agency.averageRating.toString(),
        reviewCount: agency.reviewCount,
      },
      error: null,
    };
  }

  async updateProfile(
    agencyId: string | undefined,
    dto: {
      companyName?: string;
      contactPhone?: string | null;
      address?: string | null;
      city?: string | null;
      country?: string | null;
      website?: string | null;
      logo?: string | null;
      taxNumber?: string | null;
    },
  ) {
    this.requireAgencyId(agencyId);
    await this.getProfile(agencyId);

    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(dto.companyName !== undefined
          ? { companyName: dto.companyName.trim() }
          : {}),
        ...(dto.contactPhone !== undefined
          ? { contactPhone: dto.contactPhone?.trim() || null }
          : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() || undefined }
          : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
        ...(dto.country !== undefined
          ? { country: dto.country?.trim() || null }
          : {}),
        ...(dto.website !== undefined
          ? { website: dto.website?.trim() || null }
          : {}),
        ...(dto.logo !== undefined ? { logo: dto.logo?.trim() || null } : {}),
        ...(dto.taxNumber !== undefined && dto.taxNumber?.trim()
          ? { taxNumber: dto.taxNumber.trim() }
          : {}),
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        companyName: updated.companyName,
        contactPhone: updated.contactPhone,
        address: updated.address,
        city: updated.city,
        country: updated.country,
        website: updated.website,
        logo: this.storage.resolvePublicUrl(updated.logo),
        taxNumber: updated.taxNumber,
      },
      error: null,
    };
  }

  /** Monthly revenue for financial charts (last 12 months). */
  async getFinancials(agencyId: string | undefined) {
    this.requireAgencyId(agencyId);

    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows = await this.prisma.reservation.findMany({
      where: {
        agencyId,
        deletedAt: null,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: { gte: since },
      },
      select: { createdAt: true, totalAmount: true, currency: true },
      orderBy: { createdAt: 'asc' },
    });

    const byMonth = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(since);
      d.setMonth(since.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }

    for (const row of rows) {
      const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(row.totalAmount));
    }

    const months = [...byMonth.entries()].map(([month, total]) => ({
      month,
      total: total.toFixed(2),
    }));

    const total = months.reduce((sum, m) => sum + Number(m.total), 0);

    return {
      success: true,
      data: {
        currency: 'TRY',
        total: total.toFixed(2),
        months,
      },
      error: null,
    };
  }

  async listSubUsers(agencyId: string | undefined) {
    this.requireAgencyId(agencyId);

    const rows = await this.prisma.agencyStaff.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        agencyId: row.agencyId,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        permissions: row.permissions,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      error: null,
    };
  }

  async listReservations(
    agencyId: string | undefined,
    options?: {
      q?: string;
      status?:
        | 'PENDING'
        | 'CONFIRMED'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'SUSPENDED'
        | 'PENDING_PAYMENT'
        | 'PAYMENT_FAILED';
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    this.requireAgencyId(agencyId);

    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 20));
    const rawQ = (options?.q ?? '').trim().slice(0, 80);
    const q = rawQ.replace(/[\u0000-\u001F\u007F]/g, '');

    const where: Prisma.ReservationWhereInput = {
      agencyId,
      deletedAt: null,
    };

    if (options?.status === 'PENDING') {
      where.status = {
        in: ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_FAILED'],
      };
    } else if (options?.status) {
      where.status = options.status;
    }

    const createdAt: Prisma.DateTimeFilter = {};
    if (options?.dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(options.dateFrom)) {
      createdAt.gte = new Date(`${options.dateFrom}T00:00:00.000Z`);
    }
    if (options?.dateTo && /^\d{4}-\d{2}-\d{2}$/.test(options.dateTo)) {
      createdAt.lte = new Date(`${options.dateTo}T23:59:59.999Z`);
    }
    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }

    if (q) {
      const [matchingTours, matchingExperiences] = await Promise.all([
        this.prisma.tour.findMany({
          where: {
            agencyId,
            deletedAt: null,
            title: { contains: q, mode: 'insensitive' },
          },
          select: { id: true },
          take: 50,
        }),
        this.prisma.experience.findMany({
          where: {
            agencyId,
            deletedAt: null,
            title: { contains: q, mode: 'insensitive' },
          },
          select: { id: true },
          take: 50,
        }),
      ]);
      const tourIds = matchingTours.map((t) => t.id);
      const experienceIds = matchingExperiences.map((e) => e.id);
      where.OR = [
        { bookingNumber: { contains: q, mode: 'insensitive' } },
        { contactEmail: { contains: q, mode: 'insensitive' } },
        { contactPhone: { contains: q, mode: 'insensitive' } },
        ...(tourIds.length ? [{ tourId: { in: tourIds } }] : []),
        ...(experienceIds.length
          ? [{ experienceId: { in: experienceIds } }]
          : []),
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.reservation.count({ where }),
      this.prisma.reservation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const tourIds = [
      ...new Set(rows.map((row) => row.tourId).filter(Boolean)),
    ] as string[];
    const experienceIds = [
      ...new Set(rows.map((row) => row.experienceId).filter(Boolean)),
    ] as string[];

    const [tours, experiences] = await Promise.all([
      tourIds.length
        ? this.prisma.tour.findMany({
            where: { id: { in: tourIds } },
            select: { id: true, title: true },
          })
        : [],
      experienceIds.length
        ? this.prisma.experience.findMany({
            where: { id: { in: experienceIds } },
            select: { id: true, title: true },
          })
        : [],
    ]);

    const tourTitleById = new Map(tours.map((t) => [t.id, t.title]));
    const experienceTitleById = new Map(
      experiences.map((e) => [e.id, e.title]),
    );

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: true,
      data: {
        items: rows.map((row) =>
          this.toReservation(row, {
            tourTitle: row.tourId
              ? (tourTitleById.get(row.tourId) ?? null)
              : row.experienceId
                ? (experienceTitleById.get(row.experienceId) ?? null)
                : null,
          }),
        ),
        meta: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
      error: null,
    };
  }

  async updateReservation(
    reservationId: string,
    agencyId: string | undefined,
    input: {
      status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED';
      seatNumbers?: string;
    },
  ) {
    this.requireAgencyId(agencyId);

    // IDOR: ownership check before any write event.
    const owned = await this.prisma.reservation.findFirst({
      where: { id: reservationId, agencyId, deletedAt: null },
      select: { id: true, tourId: true },
    });
    if (!owned) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı veya erişim yetkiniz yok',
      });
    }

    if (input.seatNumbers != null || input.status) {
      // Booking owns writes (Faz 5 — no ReservationService import)
      await this.eventEmitter.emitAsync('agency.reservation.update', {
        reservationId,
        agencyId,
        status: input.status,
        seatNumbers: input.seatNumbers,
      });
    }

    const refreshed = await this.prisma.reservation.findFirstOrThrow({
      where: { id: reservationId, agencyId, deletedAt: null },
    });

    await this.invalidateDashboardCache(agencyId);

    return {
      success: true,
      data: this.toReservation(refreshed),
      error: null,
    };
  }

  async updateReservationStatus(
    reservationId: string,
    agencyId: string | undefined,
    status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED',
  ) {
    return this.updateReservation(reservationId, agencyId, { status });
  }

  async getReports(
    agencyId: string | undefined,
    dateRangeId:
      | 'today'
      | 'yesterday'
      | 'thisWeek'
      | 'lastWeek'
      | 'thisMonth'
      | 'lastMonth'
      | 'last3Months'
      | 'lastYear'
      | 'custom',
  ) {
    this.requireAgencyId(agencyId);

    const range = resolveReportDateRange(dateRangeId);
    const saleStatuses = ['CONFIRMED', 'COMPLETED'] as const;

    const [current, previous, allReviews, tours] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          agencyId,
          deletedAt: null,
          createdAt: { gte: range.start, lte: range.end },
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          agencyId,
          deletedAt: null,
          createdAt: { gte: range.previousStart, lte: range.previousEnd },
        },
      }),
      this.prisma.review.findMany({
        where: { agencyId, deletedAt: null },
        select: { rating: true, tourId: true, experienceId: true },
      }),
      this.prisma.tour.findMany({
        where: { agencyId, deletedAt: null },
        select: { id: true, title: true },
      }),
    ]);

    const isSale = (status: string) =>
      saleStatuses.includes(status as (typeof saleStatuses)[number]);

    const currentSales = current.filter((r) => isSale(r.status));
    const previousSales = previous.filter((r) => isSale(r.status));

    const totalSales = currentSales.length;
    const totalRevenue = currentSales.reduce(
      (s, r) => s + Number(r.totalAmount),
      0,
    );
    const prevRevenue = previousSales.reduce(
      (s, r) => s + Number(r.totalAmount),
      0,
    );
    const compared =
      prevRevenue === 0 && totalRevenue === 0
        ? null
        : prevRevenue === 0
          ? totalRevenue > 0
            ? 100
            : 0
          : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) /
            10;

    const tourTitle = new Map(tours.map((t) => [t.id, t.title]));
    const byTour = new Map<string, { sales: number; revenue: number }>();
    for (const r of currentSales) {
      const key = r.tourId ?? r.experienceId ?? 'other';
      const prev = byTour.get(key) ?? { sales: 0, revenue: 0 };
      prev.sales += 1;
      prev.revenue += Number(r.totalAmount);
      byTour.set(key, prev);
    }

    const topSelling = [...byTour.entries()]
      .map(([id, v]) => ({
        id,
        name: tourTitle.get(id) ?? (id === 'other' ? 'Diğer' : id),
        sales: v.sales,
        revenue: Math.round(v.revenue * 100) / 100,
        growth: null as number | null,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const ratingByTour = new Map<string, number[]>();
    for (const rev of allReviews) {
      const key = rev.tourId ?? rev.experienceId;
      if (!key) continue;
      const arr = ratingByTour.get(key) ?? [];
      arr.push(rev.rating);
      ratingByTour.set(key, arr);
    }

    const avgRating = (id: string) => {
      const arr = ratingByTour.get(id) ?? [];
      if (!arr.length) return 0;
      return (
        Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      );
    };

    const completed = current.filter((r) => r.status === 'COMPLETED').length;
    const cancelled = current.filter((r) => r.status === 'CANCELLED').length;
    const completionRate =
      current.length === 0
        ? 0
        : Math.round((completed / current.length) * 1000) / 10;

    const trendMap = new Map<string, { sales: number; revenue: number }>();
    for (const r of currentSales) {
      const label = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const prev = trendMap.get(label) ?? { sales: 0, revenue: 0 };
      prev.sales += 1;
      prev.revenue += Number(r.totalAmount);
      trendMap.set(label, prev);
    }
    const trend = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, v]) => ({
        label,
        sales: v.sales,
        revenue: Math.round(v.revenue * 100) / 100,
      }));

    const customerMap = new Map<
      string,
      { bookings: number; spent: number; lastBooking: string }
    >();
    for (const r of current) {
      const email = r.contactEmail || 'bilinmiyor';
      const prev = customerMap.get(email) ?? {
        bookings: 0,
        spent: 0,
        lastBooking: r.createdAt.toISOString(),
      };
      prev.bookings += 1;
      if (isSale(r.status)) prev.spent += Number(r.totalAmount);
      if (new Date(r.createdAt) > new Date(prev.lastBooking)) {
        prev.lastBooking = r.createdAt.toISOString();
      }
      customerMap.set(email, prev);
    }

    const topCustomers = [...customerMap.entries()]
      .map(([email, v]) => ({
        id: email,
        name: email.split('@')[0] || email,
        bookings: v.bookings,
        spent: Math.round(v.spent * 100) / 100,
        lastBooking: new Date(v.lastBooking).toLocaleDateString('tr-TR'),
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8);

    const newCustomers = customerMap.size;
    const returning = [...customerMap.values()].filter(
      (c) => c.bookings > 1,
    ).length;

    const satisfaction = [5, 4, 3, 2, 1].map((rating) => {
      const count = allReviews.filter((r) => r.rating === rating).length;
      const percentage =
        allReviews.length === 0
          ? 0
          : Math.round((count / allReviews.length) * 1000) / 10;
      return { rating, percentage };
    });

    const tourPerformance = tours.map((t) => {
      const stats = byTour.get(t.id) ?? { sales: 0, revenue: 0 };
      return {
        id: t.id,
        name: t.title,
        bookings: stats.sales,
        avgRating: avgRating(t.id),
        conversionRate: null as number | null,
        revenue: Math.round(stats.revenue * 100) / 100,
      };
    });

    const overallAvg =
      allReviews.length === 0
        ? 0
        : Math.round(
            (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) *
              10,
          ) / 10;

    return {
      success: true,
      data: {
        dateRange: {
          id: range.id,
          label: range.label,
        },
        sales: {
          summary: {
            totalSales,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageOrderValue:
              totalSales === 0
                ? 0
                : Math.round((totalRevenue / totalSales) * 100) / 100,
            comparedToLastPeriod: compared,
            increase: compared === null ? null : compared >= 0,
          },
          periodLabel: range.label,
          periodRangeText: `${range.start.toLocaleDateString('tr-TR')} – ${range.end.toLocaleDateString('tr-TR')}`,
          topSelling,
          bookingSummary: {
            totalReservations: current.length,
            completedTours: completed,
            cancelledReservations: cancelled,
            refundedCount: 0,
            averageRating: overallAvg,
          },
          trend,
        },
        performance: {
          summary: {
            conversionRate: null,
            completionRate,
            avgBookingValue:
              totalSales === 0
                ? 0
                : Math.round((totalRevenue / totalSales) * 100) / 100,
            monthlyBookings: totalSales,
          },
          monthlyTrend: trend.map((t) => ({
            label: t.label,
            count: t.sales,
          })),
          tourPerformance,
          goals: [
            {
              name: 'Aylık rezervasyon',
              current: totalSales,
              target: Math.max(10, totalSales),
              percentage: Math.min(
                100,
                Math.round((totalSales / Math.max(10, totalSales)) * 100),
              ),
            },
            {
              name: 'Tamamlanma oranı',
              current: completionRate,
              target: 80,
              percentage: Math.min(
                100,
                Math.round((completionRate / 80) * 100),
              ),
            },
          ],
        },
        customer: {
          summary: {
            totalCustomers: customerMap.size,
            newCustomers,
            returningCustomers: returning,
            customerLifetimeValue:
              customerMap.size === 0
                ? 0
                : Math.round(
                    ([...customerMap.values()].reduce(
                      (s, c) => s + c.spent,
                      0,
                    ) /
                      customerMap.size) *
                      100,
                  ) / 100,
            percentChange: null,
            increase: null,
          },
          topCustomers,
          satisfactionDistribution: satisfaction,
        },
        visitors: {
          disclaimer:
            'Ziyaretçi metrikleri rezervasyon etkileşiminden türetilir. Gerçek trafik analytics sonra eklenecek.',
          summary: {
            uniqueVisitors: customerMap.size,
            totalInteractions: current.length,
            conversionRate:
              current.length === 0
                ? 0
                : Math.round((totalSales / current.length) * 1000) / 10,
            comparedToLastPeriod: compared,
            increase: compared === null ? null : compared >= 0,
          },
          trend: trend.map((t) => ({
            label: t.label,
            interactions: t.sales,
            uniqueVisitors: t.sales,
          })),
        },
      },
      error: null,
    };
  }

  private requireAgencyId(
    agencyId: string | undefined,
  ): asserts agencyId is string {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'AGENCY_REQUIRED',
        message: 'Acente hesabı gerekli',
      });
    }
  }

  private toReservation(
    row: {
      id: string;
      bookingNumber: string;
      userId: string;
      tourId: string | null;
      tourDateId: string | null;
      hotelId?: string | null;
      roomId?: string | null;
      experienceId?: string | null;
      activityDateId?: string | null;
      agencyId: string;
      status: string;
      paymentStatus?: string;
      adults: number;
      children: number;
      totalAmount: Prisma.Decimal;
      currency: string;
      contactEmail: string;
      contactPhone: string | null;
      guests?: Prisma.JsonValue;
      metadata?: Prisma.JsonValue | null;
      startDate?: Date | null;
      endDate?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    extra?: { tourTitle?: string | null },
  ) {
    const guests = Array.isArray(row.guests)
      ? (row.guests as Array<{ firstName?: string; lastName?: string }>)
      : [];
    const primary = guests[0];
    const customerName = primary
      ? `${primary.firstName ?? ''} ${primary.lastName ?? ''}`.trim()
      : row.contactEmail;
    const meta =
      row.metadata &&
      typeof row.metadata === 'object' &&
      !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};

    return {
      id: row.id,
      bookingNumber: row.bookingNumber,
      userId: row.userId,
      tourId: row.tourId,
      tourDateId: row.tourDateId,
      hotelId: row.hotelId ?? null,
      roomId: row.roomId ?? null,
      experienceId: row.experienceId ?? null,
      activityDateId: row.activityDateId ?? null,
      agencyId: row.agencyId,
      status: row.status,
      paymentStatus: row.paymentStatus ?? 'UNPAID',
      adults: row.adults,
      children: row.children,
      guestCount: row.adults + row.children,
      totalAmount: row.totalAmount.toString(),
      currency: row.currency,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      customerName,
      tourTitle: extra?.tourTitle ?? null,
      seatNumbers:
        typeof meta.seatNumbers === 'string' ? meta.seatNumbers : null,
      startDate: row.startDate?.toISOString() ?? null,
      endDate: row.endDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
