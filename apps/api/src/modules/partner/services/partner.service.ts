import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  decodeCustomerKey,
  encodeCustomerKey,
  FINANCIAL_OVERDUE_DAYS,
  maskEmail,
  maskPhone,
  parseAgencyCustomersQuery,
  parseAgencyFinancialsQuery,
  parseAgencyReportsQuery,
  parseAgencySalesGoalUpsert,
  type AgencyFinancialsQuery,
  type FinancialPaymentStatus,
} from '@turta/shared-validators';
import { ZodError } from 'zod';
import { Prisma } from '../../../generated/prisma';
import {
  AGENCY_REPORTS_MANAGER_ROLES,
  isPlatformAdminRole,
} from '../../../core/auth/utils/role-access';

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
  | 'thisYear'
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
    thisYear: {
      label: 'Bu Yıl',
      start: new Date(today.getFullYear(), 0, 1),
      end: endOfToday,
      previousStart: new Date(today.getFullYear() - 1, 0, 1),
      previousEnd: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
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

  /**
   * Financial overview — KPI aggregates via Prisma `_sum` / `_count`
   * (AgencyEarning, tenant-scoped). Keeps `total`/`months` for dashboard.
   */
  async getFinancials(
    agencyId: string | undefined,
    options?: {
      startDate?: string;
      endDate?: string;
    },
  ) {
    this.requireAgencyId(agencyId);
    const query = this.parseFinancialsQuery({
      startDate: options?.startDate,
      endDate: options?.endDate,
      page: 1,
      pageSize: 20,
    });

    const baseWhere = this.buildEarningDateWhere(agencyId, query);
    const overdueCutoff = this.overdueCutoff();

    const [totals, pendingAgg, paidAgg, overdueAgg, refundedAgg, monthBuckets] =
      await Promise.all([
        this.prisma.agencyEarning.aggregate({
          where: baseWhere,
          _sum: {
            grossAmount: true,
            commissionAmount: true,
            amount: true,
          },
          _count: { _all: true },
        }),
        this.prisma.agencyEarning.aggregate({
          where: {
            ...baseWhere,
            status: { in: ['ACCRUED', 'PAYABLE'] },
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.agencyEarning.aggregate({
          where: { ...baseWhere, status: 'PAID' },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.agencyEarning.aggregate({
          where: {
            ...baseWhere,
            status: 'ACCRUED',
            createdAt: { lt: overdueCutoff },
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.agencyEarning.aggregate({
          where: {
            ...baseWhere,
            reservation: { paymentStatus: 'REFUNDED', deletedAt: null },
          },
          _sum: { grossAmount: true },
          _count: { _all: true },
        }),
        this.prisma.agencyEarning.findMany({
          where: baseWhere,
          select: { createdAt: true, grossAmount: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    const since = query.startDate
      ? new Date(`${query.startDate}T00:00:00.000Z`)
      : (() => {
          const d = new Date();
          d.setUTCMonth(d.getUTCMonth() - 11, 1);
          d.setUTCHours(0, 0, 0, 0);
          return d;
        })();
    const until = query.endDate
      ? new Date(`${query.endDate}T23:59:59.999Z`)
      : new Date();

    const byMonth = new Map<string, number>();
    const cursor = new Date(
      Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), 1),
    );
    const endMonth = new Date(
      Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), 1),
    );
    while (cursor.getTime() <= endMonth.getTime()) {
      const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    for (const row of monthBuckets) {
      const key = `${row.createdAt.getUTCFullYear()}-${String(row.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!byMonth.has(key)) byMonth.set(key, 0);
      byMonth.set(
        key,
        (byMonth.get(key) ?? 0) + Number(row.grossAmount.toString()),
      );
    }

    const months = [...byMonth.entries()].map(([month, total]) => ({
      month,
      total: total.toFixed(2),
    }));
    const grossTotal = Number(totals._sum.grossAmount?.toString() ?? 0);

    return {
      success: true,
      data: {
        currency: 'TRY',
        total: grossTotal.toFixed(2),
        months,
        kpis: {
          grossRevenue: (
            totals._sum.grossAmount ?? new Prisma.Decimal(0)
          ).toString(),
          netEarnings: (totals._sum.amount ?? new Prisma.Decimal(0)).toString(),
          platformCommission: (
            totals._sum.commissionAmount ?? new Prisma.Decimal(0)
          ).toString(),
          pendingReceivables: (
            pendingAgg._sum.amount ?? new Prisma.Decimal(0)
          ).toString(),
          completedPayouts: (
            paidAgg._sum.amount ?? new Prisma.Decimal(0)
          ).toString(),
          overdueAmount: (
            overdueAgg._sum.amount ?? new Prisma.Decimal(0)
          ).toString(),
          refundedGross: (
            refundedAgg._sum.grossAmount ?? new Prisma.Decimal(0)
          ).toString(),
          transactionCount: totals._count._all,
          pendingCount: pendingAgg._count._all,
          paidCount: paidAgg._count._all,
          overdueCount: overdueAgg._count._all,
          refundedCount: refundedAgg._count._all,
        },
      },
      error: null,
    };
  }

  async listFinancialTransactions(
    agencyId: string | undefined,
    options?: Record<string, unknown>,
  ) {
    this.requireAgencyId(agencyId);
    const query = this.parseFinancialsQuery(options ?? {});
    const where = await this.buildFinancialTransactionWhere(agencyId, query);

    const [total, rows] = await Promise.all([
      this.prisma.agencyEarning.count({ where }),
      this.prisma.agencyEarning.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          reservation: {
            select: {
              id: true,
              bookingNumber: true,
              contactEmail: true,
              paymentStatus: true,
              status: true,
              startDate: true,
            },
          },
        },
      }),
    ]);

    const overdueCutoff = this.overdueCutoff();
    const items = rows.map((row) =>
      this.toFinancialTransactionRow(row, overdueCutoff),
    );

    return {
      success: true,
      data: {
        items,
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        },
      },
      error: null,
    };
  }

  async exportFinancials(
    agencyId: string | undefined,
    options?: Record<string, unknown>,
  ) {
    this.requireAgencyId(agencyId);
    const query = this.parseFinancialsQuery({
      ...(options ?? {}),
      page: 1,
      pageSize: 50,
    });
    const where = await this.buildFinancialTransactionWhere(agencyId, query);
    const overdueCutoff = this.overdueCutoff();

    const rows = await this.prisma.agencyEarning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000,
      include: {
        reservation: {
          select: {
            id: true,
            bookingNumber: true,
            contactEmail: true,
            paymentStatus: true,
            status: true,
            startDate: true,
          },
        },
      },
    });

    const items = rows.map((row) =>
      this.toFinancialTransactionRow(row, overdueCutoff),
    );

    const header = [
      'bookingNumber',
      'status',
      'grossAmount',
      'commissionAmount',
      'netAmount',
      'currency',
      'paymentStatus',
      'createdAt',
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      header.join(','),
      ...items.map((item) =>
        [
          item.bookingNumber,
          item.status,
          item.grossAmount,
          item.commissionAmount,
          item.netAmount,
          item.currency,
          item.reservationPaymentStatus ?? '',
          item.createdAt,
        ]
          .map((cell) => escape(String(cell)))
          .join(','),
      ),
    ];

    const stamp = new Date().toISOString().slice(0, 10);
    return {
      success: true,
      data: {
        filename: `acente-finans-${stamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        csv: `\uFEFF${lines.join('\n')}`,
        format: query.format ?? 'csv',
        rowCount: items.length,
      },
      error: null,
    };
  }

  private parseFinancialsQuery(input: unknown): AgencyFinancialsQuery {
    try {
      return parseAgencyFinancialsQuery(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'FINANCIALS_QUERY_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz finans filtresi',
          details: error.issues,
        });
      }
      throw error;
    }
  }

  private overdueCutoff(): Date {
    return new Date(Date.now() - FINANCIAL_OVERDUE_DAYS * 24 * 60 * 60 * 1000);
  }

  private buildEarningDateWhere(
    agencyId: string,
    query: AgencyFinancialsQuery,
  ): Prisma.AgencyEarningWhereInput {
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.startDate) {
      createdAt.gte = new Date(`${query.startDate}T00:00:00.000Z`);
    }
    if (query.endDate) {
      createdAt.lte = new Date(`${query.endDate}T23:59:59.999Z`);
    }
    return {
      agencyId,
      deletedAt: null,
      ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    };
  }

  private async buildFinancialTransactionWhere(
    agencyId: string,
    query: AgencyFinancialsQuery,
  ): Promise<Prisma.AgencyEarningWhereInput> {
    const where: Prisma.AgencyEarningWhereInput = {
      ...this.buildEarningDateWhere(agencyId, query),
    };
    const overdueCutoff = this.overdueCutoff();

    if (query.status === 'PAID') {
      where.status = 'PAID';
    } else if (query.status === 'PENDING') {
      where.AND = [
        {
          OR: [
            { status: 'PAYABLE' },
            { status: 'ACCRUED', createdAt: { gte: overdueCutoff } },
          ],
        },
        { NOT: { reservation: { paymentStatus: 'REFUNDED' } } },
      ];
    } else if (query.status === 'OVERDUE') {
      const dateFilter: Prisma.DateTimeFilter = {
        ...((where.createdAt as Prisma.DateTimeFilter | undefined) ?? {}),
        lt: overdueCutoff,
      };
      where.status = 'ACCRUED';
      where.createdAt = dateFilter;
      where.NOT = { reservation: { paymentStatus: 'REFUNDED' } };
    } else if (query.status === 'REFUNDED') {
      where.reservation = { paymentStatus: 'REFUNDED', deletedAt: null };
    }

    if (query.q) {
      const q = query.q;
      const searchClause: Prisma.AgencyEarningWhereInput = {
        OR: [
          {
            reservation: {
              bookingNumber: { contains: q, mode: 'insensitive' },
            },
          },
          {
            reservation: {
              contactEmail: { contains: q, mode: 'insensitive' },
            },
          },
          { reservationId: { contains: q, mode: 'insensitive' } },
        ],
      };
      where.AND = [
        ...((Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []) as Prisma.AgencyEarningWhereInput[]),
        searchClause,
      ];
    }

    return where;
  }

  private toFinancialTransactionRow(
    row: {
      id: string;
      reservationId: string;
      amount: Prisma.Decimal;
      grossAmount: Prisma.Decimal;
      commissionAmount: Prisma.Decimal;
      commissionRatePercent: Prisma.Decimal;
      currency: string;
      status: string;
      createdAt: Date;
      reservation: {
        id: string;
        bookingNumber: string;
        contactEmail: string;
        paymentStatus: string;
        status: string;
        startDate: Date | null;
      } | null;
    },
    overdueCutoff: Date,
  ) {
    const status = this.resolveFinancialStatus(row, overdueCutoff);
    return {
      id: row.id,
      reservationId: row.reservationId,
      bookingNumber: row.reservation?.bookingNumber ?? row.reservationId,
      contactEmailMasked: maskEmail(
        row.reservation?.contactEmail ?? 'unknown@example.com',
      ),
      status,
      earningStatus: row.status,
      reservationPaymentStatus: row.reservation?.paymentStatus ?? null,
      reservationStatus: row.reservation?.status ?? null,
      grossAmount: row.grossAmount.toString(),
      commissionAmount: row.commissionAmount.toString(),
      commissionRatePercent: row.commissionRatePercent.toString(),
      netAmount: row.amount.toString(),
      currency: row.currency,
      tourDate: row.reservation?.startDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private resolveFinancialStatus(
    row: {
      status: string;
      createdAt: Date;
      reservation: { paymentStatus: string } | null;
    },
    overdueCutoff: Date,
  ): FinancialPaymentStatus {
    if (row.reservation?.paymentStatus === 'REFUNDED') return 'REFUNDED';
    if (row.status === 'PAID') return 'PAID';
    if (
      row.status === 'ACCRUED' &&
      row.createdAt.getTime() < overdueCutoff.getTime()
    ) {
      return 'OVERDUE';
    }
    return 'PENDING';
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

  assertReportsManagerAccess(role: string) {
    if (
      isPlatformAdminRole(role) ||
      (AGENCY_REPORTS_MANAGER_ROLES as readonly string[]).includes(role)
    ) {
      return;
    }
    throw new ForbiddenException({
      code: 'REPORTS_FORBIDDEN',
      message: 'Raporlar yalnızca acente sahibi veya yöneticisine açıktır',
    });
  }

  async getReports(
    agencyId: string | undefined,
    options: {
      dateRangeId?: ReportDateRangeId;
      period?: 'monthly' | 'yearly';
      startDate?: string;
      endDate?: string;
      role?: string;
    } = {},
  ) {
    this.requireAgencyId(agencyId);
    if (options.role) this.assertReportsManagerAccess(options.role);

    let parsed;
    try {
      parsed = parseAgencyReportsQuery({
        period: options.period,
        dateRange: options.dateRangeId,
        startDate: options.startDate,
        endDate: options.endDate,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'REPORTS_QUERY_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz rapor filtresi',
          details: error.issues,
        });
      }
      throw error;
    }

    const range = this.resolveReportsRange(parsed);
    const saleStatuses = ['CONFIRMED', 'COMPLETED'] as const;
    const baseResWhere: Prisma.ReservationWhereInput = {
      agencyId,
      deletedAt: null,
      createdAt: { gte: range.start, lte: range.end },
    };
    const saleWhere: Prisma.ReservationWhereInput = {
      ...baseResWhere,
      status: { in: [...saleStatuses] },
    };
    const prevSaleWhere: Prisma.ReservationWhereInput = {
      agencyId,
      deletedAt: null,
      status: { in: [...saleStatuses] },
      createdAt: { gte: range.previousStart, lte: range.previousEnd },
    };

    const [
      salesAgg,
      prevSalesAgg,
      statusGroups,
      tourGroups,
      reviewAgg,
      ratingGroups,
      occupancyAgg,
      occupancyByTour,
      tours,
      distinctCustomers,
      goals,
      trendRows,
    ] = await Promise.all([
      this.prisma.reservation.aggregate({
        where: saleWhere,
        _sum: { totalAmount: true },
        _count: { _all: true },
        _avg: { totalAmount: true },
      }),
      this.prisma.reservation.aggregate({
        where: prevSaleWhere,
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: baseResWhere,
        _count: { _all: true },
      }),
      this.prisma.reservation.groupBy({
        by: ['tourId'],
        where: saleWhere,
        _sum: { totalAmount: true },
        _count: { _all: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 12,
      }),
      this.prisma.review.aggregate({
        where: { agencyId, deletedAt: null },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { agencyId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.tourDate.aggregate({
        where: {
          deletedAt: null,
          startDate: { gte: range.start, lte: range.end },
          tour: { agencyId, deletedAt: null },
        },
        _sum: { capacity: true, remainingCapacity: true },
        _count: { _all: true },
      }),
      this.prisma.tourDate.groupBy({
        by: ['tourId'],
        where: {
          deletedAt: null,
          startDate: { gte: range.start, lte: range.end },
          tour: { agencyId, deletedAt: null },
        },
        _sum: { capacity: true, remainingCapacity: true },
        _count: { _all: true },
      }),
      this.prisma.tour.findMany({
        where: { agencyId, deletedAt: null },
        select: { id: true, title: true },
      }),
      this.prisma.reservation.findMany({
        where: baseResWhere,
        distinct: ['contactEmail'],
        select: { contactEmail: true },
      }),
      this.prisma.agencySalesGoal.findMany({
        where: {
          agencyId,
          deletedAt: null,
          year: range.start.getFullYear(),
          ...(parsed.period === 'yearly' || range.id === 'thisYear'
            ? { period: 'yearly', month: 0 }
            : {
                period: 'monthly',
                month: range.start.getMonth() + 1,
              }),
        },
      }),
      this.prisma.$queryRaw<
        Array<{ label: string; sales: number; revenue: number }>
      >`
        SELECT to_char(date_trunc('month', r."createdAt"), 'YYYY-MM') AS label,
               COUNT(*)::int AS sales,
               COALESCE(SUM(r."totalAmount"), 0)::float AS revenue
        FROM booking."Reservation" r
        WHERE r."agencyId" = ${agencyId}
          AND r."deletedAt" IS NULL
          AND r.status IN ('CONFIRMED', 'COMPLETED')
          AND r."createdAt" >= ${range.start}
          AND r."createdAt" <= ${range.end}
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const totalSales = salesAgg._count._all;
    const totalRevenue = Number(salesAgg._sum.totalAmount?.toString() ?? 0);
    const prevRevenue = Number(prevSalesAgg._sum.totalAmount?.toString() ?? 0);
    const compared =
      prevRevenue === 0 && totalRevenue === 0
        ? null
        : prevRevenue === 0
          ? totalRevenue > 0
            ? 100
            : 0
          : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) /
            10;

    const statusCount = (status: string) =>
      statusGroups.find((g) => g.status === status)?._count._all ?? 0;
    const totalReservations = statusGroups.reduce(
      (s, g) => s + g._count._all,
      0,
    );
    const completed = statusCount('COMPLETED');
    const cancelled = statusCount('CANCELLED');
    const completionRate =
      totalReservations === 0
        ? 0
        : Math.round((completed / totalReservations) * 1000) / 10;

    const capacity = Number(occupancyAgg._sum.capacity ?? 0);
    const remaining = Number(occupancyAgg._sum.remainingCapacity ?? 0);
    const soldSeats = Math.max(0, capacity - remaining);
    const occupancyRate =
      capacity === 0 ? 0 : Math.round((soldSeats / capacity) * 1000) / 10;

    const tourTitle = new Map(tours.map((t) => [t.id, t.title]));
    const topSelling = tourGroups
      .filter((g) => g.tourId)
      .map((g) => ({
        id: g.tourId as string,
        name: tourTitle.get(g.tourId as string) ?? g.tourId!,
        sales: g._count._all,
        revenue: Math.round(Number(g._sum.totalAmount ?? 0) * 100) / 100,
        growth: null as number | null,
      }));

    const occupancyChart = occupancyByTour
      .filter((g) => g.tourId)
      .map((g) => {
        const cap = Number(g._sum.capacity ?? 0);
        const rem = Number(g._sum.remainingCapacity ?? 0);
        const sold = Math.max(0, cap - rem);
        return {
          id: g.tourId as string,
          name: tourTitle.get(g.tourId as string) ?? g.tourId!,
          capacity: cap,
          sold,
          occupancyRate: cap === 0 ? 0 : Math.round((sold / cap) * 1000) / 10,
        };
      })
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 10);

    const overallAvg = Number(reviewAgg._avg.rating ?? 0);
    const reviewTotal = reviewAgg._count._all;
    const satisfaction = [5, 4, 3, 2, 1].map((rating) => {
      const count =
        ratingGroups.find((g) => g.rating === rating)?._count._all ?? 0;
      return {
        rating,
        percentage:
          reviewTotal === 0 ? 0 : Math.round((count / reviewTotal) * 1000) / 10,
      };
    });

    const trend = trendRows.map((t) => ({
      label: t.label,
      sales: Number(t.sales),
      revenue: Math.round(Number(t.revenue) * 100) / 100,
    }));

    const prevSalesCount = prevSalesAgg._count._all;
    const goalDefs = [
      {
        metric: 'reservations' as const,
        name: 'Rezervasyon hedefi',
        current: totalSales,
        fallbackTarget: Math.max(10, Math.round(prevSalesCount * 1.1) || 10),
      },
      {
        metric: 'revenue' as const,
        name: 'Ciro hedefi',
        current: Math.round(totalRevenue * 100) / 100,
        fallbackTarget: Math.max(1000, Math.round(prevRevenue * 1.1) || 1000),
      },
      {
        metric: 'occupancy' as const,
        name: 'Doluluk oranı',
        current: occupancyRate,
        fallbackTarget: 75,
      },
      {
        metric: 'completion' as const,
        name: 'Tamamlanma oranı',
        current: completionRate,
        fallbackTarget: 80,
      },
    ];

    const goalsPayload = goalDefs.map((def) => {
      const stored = goals.find((g) => g.metric === def.metric);
      const target = stored
        ? Number(stored.targetValue.toString())
        : def.fallbackTarget;
      const percentage =
        target <= 0
          ? 0
          : Math.min(100, Math.round((def.current / target) * 100));
      return {
        id: stored?.id ?? null,
        metric: def.metric,
        name: def.name,
        current: def.current,
        target,
        percentage,
        source: stored ? ('stored' as const) : ('baseline' as const),
      };
    });

    const tourPerformance = tours.map((t) => {
      const stats = tourGroups.find((g) => g.tourId === t.id);
      const occ = occupancyChart.find((o) => o.id === t.id);
      return {
        id: t.id,
        name: t.title,
        bookings: stats?._count._all ?? 0,
        avgRating: Math.round(overallAvg * 10) / 10,
        conversionRate: null as number | null,
        revenue: Math.round(Number(stats?._sum.totalAmount ?? 0) * 100) / 100,
        occupancyRate: occ?.occupancyRate ?? 0,
      };
    });

    const customerCount = distinctCustomers.length;

    return {
      success: true,
      data: {
        dateRange: {
          id: range.id,
          label: range.label,
          period:
            parsed.period ?? (range.id === 'thisYear' ? 'yearly' : 'monthly'),
        },
        sales: {
          summary: {
            totalSales,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageOrderValue:
              totalSales === 0
                ? 0
                : Math.round(
                    Number(salesAgg._avg.totalAmount?.toString() ?? 0) * 100,
                  ) / 100,
            comparedToLastPeriod: compared,
            increase: compared === null ? null : compared >= 0,
          },
          periodLabel: range.label,
          periodRangeText: `${range.start.toLocaleDateString('tr-TR')} – ${range.end.toLocaleDateString('tr-TR')}`,
          topSelling,
          bookingSummary: {
            totalReservations,
            completedTours: completed,
            cancelledReservations: cancelled,
            refundedCount: 0,
            averageRating: Math.round(overallAvg * 10) / 10,
          },
          trend,
          occupancy: {
            capacity,
            soldSeats,
            occupancyRate,
            byTour: occupancyChart,
          },
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
            occupancyRate,
          },
          monthlyTrend: trend.map((t) => ({
            label: t.label,
            count: t.sales,
          })),
          tourPerformance,
          goals: goalsPayload,
        },
        customer: {
          summary: {
            totalCustomers: customerCount,
            newCustomers: customerCount,
            returningCustomers: 0,
            customerLifetimeValue:
              customerCount === 0
                ? 0
                : Math.round((totalRevenue / customerCount) * 100) / 100,
            percentChange: null,
            increase: null,
          },
          topCustomers: topSelling.slice(0, 5).map((t) => ({
            id: t.id,
            name: t.name,
            bookings: t.sales,
            spent: t.revenue,
            lastBooking: range.label,
          })),
          satisfactionDistribution: satisfaction,
        },
        visitors: {
          disclaimer:
            'Ziyaretçi metrikleri rezervasyon etkileşiminden türetilir.',
          summary: {
            uniqueVisitors: customerCount,
            totalInteractions: totalReservations,
            conversionRate:
              totalReservations === 0
                ? 0
                : Math.round((totalSales / totalReservations) * 1000) / 10,
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

  async upsertSalesGoal(
    agencyId: string | undefined,
    role: string,
    input: unknown,
  ) {
    this.requireAgencyId(agencyId);
    this.assertReportsManagerAccess(role);

    let parsed;
    try {
      parsed = parseAgencySalesGoalUpsert(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'SALES_GOAL_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz hedef',
          details: error.issues,
        });
      }
      throw error;
    }

    if (
      parsed.period === 'monthly' &&
      (parsed.month == null || parsed.month < 1)
    ) {
      throw new BadRequestException({
        code: 'SALES_GOAL_MONTH_REQUIRED',
        message: 'Aylık hedef için month (1-12) zorunlu',
      });
    }

    /** yearly → month 0 (NULL unique sorununu önlemek için) */
    const month = parsed.period === 'yearly' ? 0 : (parsed.month as number);

    const row = await this.prisma.agencySalesGoal.upsert({
      where: {
        agencyId_period_metric_year_month: {
          agencyId,
          period: parsed.period,
          metric: parsed.metric,
          year: parsed.year,
          month,
        },
      },
      create: {
        agencyId,
        period: parsed.period,
        metric: parsed.metric,
        year: parsed.year,
        month,
        targetValue: new Prisma.Decimal(parsed.targetValue),
      },
      update: {
        targetValue: new Prisma.Decimal(parsed.targetValue),
        deletedAt: null,
      },
    });

    return { success: true, data: row, error: null };
  }

  private resolveReportsRange(parsed: {
    period?: 'monthly' | 'yearly';
    dateRange?: string;
    startDate?: string;
    endDate?: string;
  }) {
    if (parsed.startDate && parsed.endDate) {
      const start = new Date(`${parsed.startDate}T00:00:00.000Z`);
      const end = new Date(`${parsed.endDate}T23:59:59.999Z`);
      const span = end.getTime() - start.getTime();
      return {
        id: 'custom' as ReportDateRangeId,
        label: 'Özel Tarih Aralığı',
        start,
        end,
        previousStart: new Date(start.getTime() - span - 1),
        previousEnd: new Date(start.getTime() - 1),
      };
    }

    if (parsed.period === 'yearly' && !parsed.dateRange) {
      return resolveReportDateRange('thisYear');
    }
    if (parsed.period === 'monthly' && !parsed.dateRange) {
      return resolveReportDateRange('thisMonth');
    }

    const id = (parsed.dateRange ?? 'thisMonth') as ReportDateRangeId;
    return resolveReportDateRange(id);
  }

  /**
   * Tenant-scoped CRM list: distinct contactEmail for this agency's
   * reservations, with pagination + name/email/phone search (no N+1).
   */
  async listCustomers(
    agencyId: string | undefined,
    options?: { q?: string; page?: number; pageSize?: number },
  ) {
    this.requireAgencyId(agencyId);

    let parsed: ReturnType<typeof parseAgencyCustomersQuery>;
    try {
      parsed = parseAgencyCustomersQuery(options ?? {});
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'CUSTOMERS_QUERY_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz müşteri araması',
          details: error.issues,
        });
      }
      throw error;
    }

    const { q, page, pageSize } = parsed;
    const where = await this.buildCustomerReservationWhere(agencyId, q);

    const [groups, groupKeys] = await Promise.all([
      this.prisma.reservation.groupBy({
        by: ['contactEmail'],
        where,
        _count: { _all: true },
        _max: { createdAt: true, startDate: true },
        _sum: { totalAmount: true },
        orderBy: { _max: { createdAt: 'desc' } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.reservation.groupBy({
        by: ['contactEmail'],
        where,
      }),
    ]);

    const emails = groups.map((g) => g.contactEmail);
    const latestRows = emails.length
      ? await this.prisma.reservation.findMany({
          where: {
            agencyId,
            deletedAt: null,
            contactEmail: { in: emails },
          },
          distinct: ['contactEmail'],
          orderBy: { createdAt: 'desc' },
          select: {
            contactEmail: true,
            contactPhone: true,
            userId: true,
          },
        })
      : [];

    const userIds = [
      ...new Set(latestRows.map((r) => r.userId).filter(Boolean)),
    ];
    const users = emails.length
      ? await this.prisma.user.findMany({
          where: {
            deletedAt: null,
            OR: [
              ...emails.map((email) => ({
                email: { equals: email, mode: 'insensitive' as const },
              })),
              ...(userIds.length ? [{ id: { in: userIds } }] : []),
            ],
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        })
      : [];

    const latestByEmail = new Map(
      latestRows.map((r) => [r.contactEmail.toLowerCase(), r]),
    );
    const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
    const userById = new Map(users.map((u) => [u.id, u]));

    const items = groups.map((g) => {
      const email = g.contactEmail;
      const latest = latestByEmail.get(email.toLowerCase());
      const user =
        (latest?.userId ? userById.get(latest.userId) : undefined) ??
        userByEmail.get(email.toLowerCase());
      const displayName =
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        email.split('@')[0] ||
        'Müşteri';
      const phone = latest?.contactPhone ?? user?.phone ?? null;
      const lastTourDate =
        g._max.startDate?.toISOString() ??
        g._max.createdAt?.toISOString() ??
        null;

      return {
        id: encodeCustomerKey(email),
        displayName,
        emailMasked: maskEmail(email),
        phoneMasked: maskPhone(phone),
        reservationCount: g._count._all,
        totalSpent: (g._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
        currency: 'TRY',
        lastTourDate,
        lastBookingAt: g._max.createdAt?.toISOString() ?? null,
      };
    });

    return {
      success: true,
      data: {
        items,
        meta: {
          page,
          pageSize,
          total: groupKeys.length,
          totalPages: Math.max(1, Math.ceil(groupKeys.length / pageSize)),
        },
      },
      error: null,
    };
  }

  /** Detail drawer — full contact for owning agency only (IDOR-safe). */
  async getCustomerDetail(agencyId: string | undefined, customerKey: string) {
    this.requireAgencyId(agencyId);

    let email: string;
    try {
      email = decodeCustomerKey(customerKey);
    } catch {
      throw new BadRequestException({
        code: 'CUSTOMER_KEY_INVALID',
        message: 'Geçersiz müşteri anahtarı',
      });
    }

    const ownedCount = await this.prisma.reservation.count({
      where: {
        agencyId,
        deletedAt: null,
        contactEmail: { equals: email, mode: 'insensitive' },
      },
    });
    if (ownedCount === 0) {
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: 'Müşteri bulunamadı veya erişim yetkiniz yok',
      });
    }

    const reservations = await this.prisma.reservation.findMany({
      where: {
        agencyId,
        deletedAt: null,
        contactEmail: { equals: email, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        totalAmount: true,
        currency: true,
        contactEmail: true,
        contactPhone: true,
        tourId: true,
        experienceId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        userId: true,
      },
    });

    const tourIds = [
      ...new Set(reservations.map((r) => r.tourId).filter(Boolean)),
    ] as string[];
    const experienceIds = [
      ...new Set(reservations.map((r) => r.experienceId).filter(Boolean)),
    ] as string[];

    const [tours, experiences, user] = await Promise.all([
      tourIds.length
        ? this.prisma.tour.findMany({
            where: { id: { in: tourIds }, agencyId },
            select: { id: true, title: true },
          })
        : [],
      experienceIds.length
        ? this.prisma.experience.findMany({
            where: { id: { in: experienceIds }, agencyId },
            select: { id: true, title: true },
          })
        : [],
      this.prisma.user.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            {
              id: {
                in: [...new Set(reservations.map((r) => r.userId))],
              },
            },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      }),
    ]);

    const tourTitleById = new Map(tours.map((t) => [t.id, t.title]));
    const experienceTitleById = new Map(
      experiences.map((e) => [e.id, e.title]),
    );
    const latest = reservations[0];
    const displayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      email.split('@')[0] ||
      'Müşteri';

    const history = reservations.map((r) => ({
      id: r.id,
      bookingNumber: r.bookingNumber,
      title:
        (r.tourId ? tourTitleById.get(r.tourId) : null) ??
        (r.experienceId ? experienceTitleById.get(r.experienceId) : null) ??
        'Rezervasyon',
      status: r.status,
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod,
      totalAmount: r.totalAmount.toString(),
      currency: r.currency,
      startDate: r.startDate?.toISOString() ?? null,
      endDate: r.endDate?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        id: encodeCustomerKey(email),
        displayName,
        email,
        emailMasked: maskEmail(email),
        phone: latest?.contactPhone ?? user?.phone ?? null,
        phoneMasked: maskPhone(latest?.contactPhone ?? user?.phone),
        reservationCount: ownedCount,
        totalSpent: reservations
          .reduce((sum, r) => sum.add(r.totalAmount), new Prisma.Decimal(0))
          .toString(),
        currency: latest?.currency ?? 'TRY',
        tours: history,
        payments: history.map((h) => ({
          id: h.id,
          bookingNumber: h.bookingNumber,
          amount: h.totalAmount,
          currency: h.currency,
          paymentStatus: h.paymentStatus,
          paymentMethod: h.paymentMethod,
          createdAt: h.createdAt,
        })),
      },
      error: null,
    };
  }

  private async buildCustomerReservationWhere(
    agencyId: string,
    q: string,
  ): Promise<Prisma.ReservationWhereInput> {
    const where: Prisma.ReservationWhereInput = {
      agencyId,
      deletedAt: null,
    };

    if (!q) return where;

    const matchingUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: 100,
    });

    where.OR = [
      { contactEmail: { contains: q, mode: 'insensitive' } },
      { contactPhone: { contains: q, mode: 'insensitive' } },
      ...(matchingUsers.length
        ? [{ userId: { in: matchingUsers.map((u) => u.id) } }]
        : []),
    ];

    return where;
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
