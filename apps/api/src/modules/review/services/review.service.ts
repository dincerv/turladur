import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Review as SharedReview } from '@turta/shared-types';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT } from '@turta/shared-constants';

import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ListReviewsQueryDto } from '../dto/list-reviews-query.dto';
import { PersonaMatchDto } from '../dto/persona-match.dto';
import { ReplyReviewDto } from '../dto/reply-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewCreatedEvent } from '../events/review-created.event';
import { ReviewDeletedEvent } from '../events/review-deleted.event';
import { ReviewUpdatedEvent } from '../events/review-updated.event';
import { buildTourPersonaMatch } from '../utils/persona-review-engine';
import {
  clampStar,
  computeOverallRating,
  resolveReviewCriteria,
  type ReviewCriteriaFlags,
} from '../utils/review-scoring';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateReviewDto, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: dto.reservationId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    if (reservation.userId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_BOOKING_OWNER',
        message: 'Sadece kendi rezervasyonunuz için yorum yazabilirsiniz',
      });
    }

    if (reservation.status !== 'COMPLETED') {
      throw new BusinessException(
        'BOOKING_NOT_COMPLETED',
        'Yorum yazmak için tur tamamlanmış olmalıdır',
      );
    }

    const existing = await this.prisma.review.findFirst({
      where: { reservationId: reservation.id, deletedAt: null },
    });
    if (existing) {
      throw new BusinessException(
        'REVIEW_ALREADY_EXISTS',
        'Bu rezervasyon için zaten yorum var',
      );
    }

    let agencyId: string | null = reservation.agencyId ?? null;
    let guideId: string | null = null;
    let busCompanyId: string | null = null;
    let criteria: ReviewCriteriaFlags = {
      guide: true,
      value: true,
      transport: true,
      accommodation: true,
    };

    if (reservation.tourId) {
      const tour = await this.prisma.tour.findFirst({
        where: { id: reservation.tourId, deletedAt: null },
        select: {
          agencyId: true,
          stayKind: true,
          extras: true,
          accommodation: { select: { id: true, deletedAt: true } },
          pickupPoints: {
            where: { deletedAt: null },
            select: { id: true },
            take: 1,
          },
        },
      });
      if (!agencyId) agencyId = tour?.agencyId ?? null;
      if (tour) {
        const extras =
          tour.extras &&
          typeof tour.extras === 'object' &&
          !Array.isArray(tour.extras)
            ? (tour.extras as Record<string, unknown>)
            : {};
        const transportation =
          typeof extras.transportation === 'string'
            ? extras.transportation.trim()
            : '';
        criteria = resolveReviewCriteria({
          stayKind: tour.stayKind,
          hasPickupPoints: tour.pickupPoints.length > 0,
          hasTransportation: transportation.length > 0,
          hasAccommodation: Boolean(
            tour.accommodation && !tour.accommodation.deletedAt,
          ),
        });
      }
    }

    if (!agencyId) {
      throw new BusinessException(
        'AGENCY_REQUIRED',
        'Rezervasyon için acente kimliği bulunamadı',
      );
    }

    if (reservation.tourDateId) {
      const tourDate = await this.prisma.tourDate.findFirst({
        where: { id: reservation.tourDateId, deletedAt: null },
        select: { guideId: true, busCompanyId: true },
      });
      guideId = tourDate?.guideId ?? null;
      busCompanyId = tourDate?.busCompanyId ?? null;
    }

    const guideRating = clampStar(dto.guideRating);
    const valueRating = clampStar(dto.valueRating);
    if (!guideRating || !valueRating) {
      throw new BusinessException(
        'REVIEW_CRITERIA_REQUIRED',
        'Rehberlik ve fiyat/performans puanları zorunludur',
      );
    }

    const transportRating = criteria.transport
      ? clampStar(dto.transportRating)
      : null;
    const accommodationRating = criteria.accommodation
      ? clampStar(dto.accommodationRating)
      : null;

    if (criteria.transport && !transportRating) {
      throw new BusinessException(
        'TRANSPORT_RATING_REQUIRED',
        'Bu tur için ulaşım puanı zorunludur',
      );
    }
    if (criteria.accommodation && !accommodationRating) {
      throw new BusinessException(
        'ACCOMMODATION_RATING_REQUIRED',
        'Bu tur için konaklama puanı zorunludur',
      );
    }

    const computed = computeOverallRating(
      {
        guide: guideRating,
        value: valueRating,
        transport: transportRating ?? undefined,
        accommodation: accommodationRating ?? undefined,
      },
      criteria,
    );
    const overall = Math.max(
      1,
      Math.min(5, Math.round(dto.rating ?? computed)),
    );

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          targetType: reservation.tourId
            ? 'TOUR'
            : reservation.experienceId
              ? 'EXPERIENCE'
              : 'PARTNER',
          tourId: reservation.tourId,
          experienceId: reservation.experienceId,
          reservationId: reservation.id,
          userId,
          agencyId: reservation.agencyId,

          guideId,
          busCompanyId,
          rating: overall,
          comment: dto.comment?.trim(),
          photoUrls: dto.photoUrls ?? [],
          guideRating,
          operatorRating: valueRating,
          transportRating,
          accommodationRating,
          travelerContext: dto.travelerContext,
          tags: (dto.tags ?? [])
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 8),
          guideFeedback: dto.guideFeedback?.trim(),
          transportFeedback: dto.transportFeedback?.trim(),
          accommodationFeedback: dto.accommodationFeedback?.trim(),
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Review',
          aggregateId: created.id,
          eventType: 'review.created',
          payload: {
            reviewId: created.id,
            tourId: created.tourId,
            experienceId: created.experienceId,
            agencyId: created.agencyId,

            rating: created.rating,
          },
          status: 'PENDING',
          availableAt: new Date(),
        },
      });

      return created;
    });

    this.eventEmitter.emit(
      'review.created',
      new ReviewCreatedEvent(
        review.id,
        review.tourId,
        review.agencyId,
        review.userId,
        review.rating,
        review.experienceId,
      ),
    );

    return { success: true, data: this.toShared(review), error: null };
  }

  async update(reviewId: string, dto: UpdateReviewDto, userId: string) {
    const review = await this.findActive(reviewId);
    if (review.userId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_REVIEW_OWNER',
        message: 'Bu yorumu düzenleyemezsiniz',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.review.update({
        where: { id: reviewId },
        data: {
          ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
          ...(dto.comment !== undefined
            ? { comment: dto.comment?.trim() ?? null }
            : {}),
          ...(dto.photoUrls !== undefined ? { photoUrls: dto.photoUrls } : {}),
          version: { increment: 1 },
        },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Review',
          aggregateId: row.id,
          eventType: 'review.updated',
          payload: {
            reviewId: row.id,
            tourId: row.tourId,
            experienceId: row.experienceId,
            agencyId: row.agencyId,
          },
          status: 'PENDING',
          availableAt: new Date(),
        },
      });

      return row;
    });

    this.eventEmitter.emit(
      'review.updated',
      new ReviewUpdatedEvent(
        updated.id,
        updated.tourId,
        updated.agencyId,
        updated.experienceId,
      ),
    );

    return { success: true, data: this.toShared(updated), error: null };
  }

  async softDelete(reviewId: string, userId: string, role: string) {
    const review = await this.findActive(reviewId);
    const isAdmin = isPlatformAdminRole(role);
    if (review.userId !== userId && !isAdmin) {
      throw new ForbiddenException({
        code: 'NOT_REVIEW_OWNER',
        message: 'Bu yorumu silemezsiniz',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { deletedAt: new Date(), deletedBy: userId },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Review',
          aggregateId: review.id,
          eventType: 'review.deleted',
          payload: {
            reviewId: review.id,
            tourId: review.tourId,
            experienceId: review.experienceId,
            agencyId: review.agencyId,
          },
          status: 'PENDING',
          availableAt: new Date(),
        },
      });
    });

    this.eventEmitter.emit(
      'review.deleted',
      new ReviewDeletedEvent(
        review.id,
        review.tourId,
        review.agencyId,
        review.experienceId,
      ),
    );

    return {
      success: true,
      data: { id: reviewId, deleted: true },
      error: null,
    };
  }

  async reply(
    reviewId: string,
    dto: ReplyReviewDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const review = await this.findActive(reviewId);
    const isAdmin = isPlatformAdminRole(role);
    if (!isAdmin) {
      if (!agencyId || review.agencyId !== agencyId) {
        throw new ForbiddenException({
          code: 'PARTNER_MISMATCH',
          message: 'Bu yoruma yanıt veremezsiniz',
        });
      }

      if (review.tourId) {
        const tour = await this.prisma.tour.findFirst({
          where: { id: review.tourId, agencyId, deletedAt: null },
          select: { id: true },
        });
        if (!tour) {
          throw new ForbiddenException({
            code: 'TOUR_OWNERSHIP_MISMATCH',
            message: 'Bu yoruma yanıt veremezsiniz',
          });
        }
      }

      if (review.experienceId) {
        const experience = await this.prisma.experience.findFirst({
          where: { id: review.experienceId, agencyId, deletedAt: null },
          select: { id: true },
        });
        if (!experience) {
          throw new ForbiddenException({
            code: 'EXPERIENCE_OWNERSHIP_MISMATCH',
            message: 'Bu yoruma yanıt veremezsiniz',
          });
        }
      }
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        partnerReply: dto.reply.trim(),
        partnerRepliedAt: new Date(),
        agencyReply: dto.reply.trim(),
        agencyRepliedAt: new Date(),
      },
    });

    return { success: true, data: this.toShared(updated), error: null };
  }

  async listByTour(tourId: string, query: ListReviewsQueryDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_PAGE_LIMIT;
    const where = {
      tourId,
      deletedAt: null,
      ...(query.minRating ? { rating: { gte: query.minRating } } : {}),
      ...(query.hasPhotos ? { photoUrls: { isEmpty: false } } : {}),
      ...(query.travelerContext
        ? { travelerContext: query.travelerContext }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      success: true,
      data: rows.map((r) => this.toShared(r)),
      error: null,
      meta: { page, limit, total },
    };
  }

  async getTourSummary(tourId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
      select: {
        id: true,
        stayKind: true,
        extras: true,
        averageRating: true,
        reviewCount: true,
        agencyId: true,
        agency: {
          select: { averageRating: true, reviewCount: true, companyName: true },
        },
        accommodation: { select: { id: true, deletedAt: true } },
        pickupPoints: {
          where: { deletedAt: null },
          select: { id: true },
          take: 1,
        },
        metrics: true,
      },
    });
    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    const extras =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? (tour.extras as Record<string, unknown>)
        : {};
    const transportation =
      typeof extras.transportation === 'string'
        ? extras.transportation.trim()
        : '';
    const criteria = resolveReviewCriteria({
      stayKind: tour.stayKind,
      hasPickupPoints: tour.pickupPoints.length > 0,
      hasTransportation: transportation.length > 0,
      hasAccommodation: Boolean(
        tour.accommodation && !tour.accommodation.deletedAt,
      ),
    });

    const reviewCount = tour.metrics?.reviewCount ?? tour.reviewCount;
    const coldStart = reviewCount < 3;
    const topTags = parseTopTags(tour.metrics?.topTags);

    return {
      success: true,
      data: {
        reviewCount,
        averageRating: Number(
          (coldStart
            ? (tour.agency.averageRating ?? tour.averageRating)
            : (tour.metrics?.averageRating ?? tour.averageRating)
          ).toString(),
        ),
        averageGuideRating: nullableNum(tour.metrics?.averageGuideRating),
        averageValueRating: nullableNum(tour.metrics?.averageOperatorRating),
        averageTransportRating: criteria.transport
          ? nullableNum(tour.metrics?.averageTransportRating)
          : null,
        averageAccommodationRating: criteria.accommodation
          ? nullableNum(tour.metrics?.averageAccommodationRating)
          : null,
        topTags,
        ratingSource: coldStart
          ? ('AGENCY_COLD_START' as const)
          : ('TOUR' as const),
        agencyAverageRating: Number(
          (tour.agency.averageRating ?? 0).toString(),
        ),
        agencyReviewCount: tour.agency.reviewCount,
        agencyName: tour.agency.companyName,
        criteria,
      },
      error: null,
    };
  }

  /**
   * Persona-based review matching — tags + fit score for traveler intent.
   */
  async matchPersona(tourId: string, dto: PersonaMatchDto) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
      select: { id: true },
    });
    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    const reviews = await this.prisma.review.findMany({
      where: {
        tourId,
        deletedAt: null,
        targetType: 'TOUR',
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    const data = buildTourPersonaMatch({
      tourId,
      persona: dto.persona,
      intent: dto.intent,
      reviews,
    });

    return { success: true, data, error: null };
  }

  async listForPartner(agencyId: string | undefined) {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'PARTNER_REQUIRED',
        message: 'Partner hesabı gerekli',
      });
    }

    const rows = await this.prisma.review.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const userIds = [...new Set(rows.map((r) => r.userId))];
    const tourIds = [
      ...new Set(rows.map((r) => r.tourId).filter((id): id is string => !!id)),
    ];
    const experienceIds = [
      ...new Set(
        rows.map((r) => r.experienceId).filter((id): id is string => !!id),
      ),
    ];

    const [users, tours, experiences] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          })
        : Promise.resolve(
            [] as Array<{
              id: string;
              firstName: string | null;
              lastName: string | null;
              email: string;
            }>,
          ),
      tourIds.length
        ? this.prisma.tour.findMany({
            where: { id: { in: tourIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([] as Array<{ id: string; title: string }>),
      experienceIds.length
        ? this.prisma.experience.findMany({
            where: { id: { in: experienceIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([] as Array<{ id: string; title: string }>),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const tourTitle = new Map(tours.map((t) => [t.id, t.title]));
    const experienceTitle = new Map(experiences.map((e) => [e.id, e.title]));

    const reviews = rows.map((r) => {
      const user = userMap.get(r.userId);
      const customerName = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.email
        : 'Misafir';
      const productType = r.experienceId
        ? ('experience' as const)
        : ('tour' as const);
      const tourName = r.tourId
        ? (tourTitle.get(r.tourId) ?? 'Tur')
        : r.experienceId
          ? (experienceTitle.get(r.experienceId) ?? 'Aktivite')
          : 'Ürün';

      return {
        id: r.id,
        customerName,
        customerImage: null as string | null,
        tourName,
        tourId: r.tourId ?? r.experienceId ?? '',
        productType,
        rating: r.rating,
        categoryRatings: {
          guideRating: r.guideRating ?? r.rating,
          operatorRating: r.operatorRating ?? r.rating,
          routeRating: r.routeRating ?? r.rating,
          foodRating: r.foodRating ?? r.rating,
          hotelRating: r.hotelRating ?? r.rating,
          transportRating: r.transportRating ?? r.rating,
        },
        categoryFeedback: {
          guideFeedback: null,
          operatorFeedback: null,
          routeFeedback: null,
          foodFeedback: null,
          hotelFeedback: null,
          transportFeedback: null,
        },
        reviewDate: r.createdAt.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        reviewDateRaw: r.createdAt.toISOString(),
        reviewText: r.comment ?? '',
        isResponded: Boolean(r.partnerReply),
        responseText: r.partnerReply ?? undefined,
      };
    });

    const responded = reviews.filter((r) => r.isResponded).length;
    const avg =
      reviews.length === 0
        ? 0
        : Math.round(
            (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10,
          ) / 10;

    return {
      success: true,
      data: {
        reviews,
        stats: {
          total: reviews.length,
          responded,
          pending: reviews.length - responded,
          averageRating: avg,
        },
      },
      error: null,
    };
  }

  async listMine(userId: string) {
    const rows = await this.prisma.review.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const tourIds = [
      ...new Set(rows.map((r) => r.tourId).filter((id): id is string => !!id)),
    ];
    const experienceIds = [
      ...new Set(
        rows.map((r) => r.experienceId).filter((id): id is string => !!id),
      ),
    ];

    const [tours, experiences] = await Promise.all([
      tourIds.length
        ? this.prisma.tour.findMany({
            where: { id: { in: tourIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([] as Array<{ id: string; title: string }>),
      experienceIds.length
        ? this.prisma.experience.findMany({
            where: { id: { in: experienceIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([] as Array<{ id: string; title: string }>),
    ]);

    const tourTitle = new Map(tours.map((t) => [t.id, t.title]));
    const experienceTitle = new Map(experiences.map((e) => [e.id, e.title]));

    return {
      success: true,
      data: rows.map((r) =>
        this.toShared(r, {
          targetTitle: r.tourId
            ? (tourTitle.get(r.tourId) ?? null)
            : r.experienceId
              ? (experienceTitle.get(r.experienceId) ?? null)
              : null,
        }),
      ),
      error: null,
    };
  }

  async getEligibleReservation(tourId: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        tourId,
        userId,
        status: 'COMPLETED',
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const summary = await this.getTourSummary(tourId);
    const criteria = summary.data.criteria;

    if (!reservation) {
      return {
        success: true,
        data: { reservationId: null, alreadyReviewed: false, criteria },
        error: null,
      };
    }

    const existing = await this.prisma.review.findFirst({
      where: { reservationId: reservation.id, deletedAt: null },
    });

    return {
      success: true,
      data: {
        reservationId: reservation.id,
        alreadyReviewed: Boolean(existing),
        criteria,
      },
      error: null,
    };
  }

  private async findActive(id: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
    });
    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadı',
      });
    }
    return review;
  }

  private toShared(
    row: {
      id: string;
      tourId: string | null;
      experienceId?: string | null;
      hotelId?: string | null;
      reservationId: string;
      userId: string;
      agencyId: string;
      rating: number;
      comment: string | null;
      photoUrls: string[];
      guideRating?: number | null;
      operatorRating?: number | null;
      transportRating?: number | null;
      accommodationRating?: number | null;
      travelerContext?: string | null;
      tags?: string[];
      partnerReply: string | null;
      partnerRepliedAt: Date | null;
      agencyReply?: string | null;
      agencyRepliedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    extras?: { targetTitle?: string | null },
  ): SharedReview {
    return {
      id: row.id,
      tourId: row.tourId,
      experienceId: row.experienceId ?? null,
      hotelId: row.hotelId ?? null,
      reservationId: row.reservationId,
      userId: row.userId,
      partnerId: row.agencyId,
      agencyId: row.agencyId,
      rating: row.rating,
      comment: row.comment,
      photoUrls: row.photoUrls,
      guideRating: row.guideRating ?? null,
      valueRating: row.operatorRating ?? null,
      transportRating: row.transportRating ?? null,
      accommodationRating: row.accommodationRating ?? null,
      travelerContext:
        row.travelerContext === 'SOLO' ||
        row.travelerContext === 'COUPLE' ||
        row.travelerContext === 'FAMILY' ||
        row.travelerContext === 'FRIENDS'
          ? row.travelerContext
          : null,
      tags: row.tags ?? [],
      partnerReply: row.partnerReply,
      partnerRepliedAt: row.partnerRepliedAt?.toISOString() ?? null,
      agencyReply: row.agencyReply ?? row.partnerReply,
      agencyRepliedAt:
        (row.agencyRepliedAt ?? row.partnerRepliedAt)?.toISOString() ?? null,
      targetTitle: extras?.targetTitle ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

function nullableNum(
  value: { toString(): string } | null | undefined,
): number | null {
  if (value == null) return null;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

function parseTopTags(raw: unknown): Array<{ tag: string; count: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as { tag?: unknown; count?: unknown };
      if (typeof row.tag !== 'string') return null;
      const count = Number(row.count ?? 0);
      return { tag: row.tag, count: Number.isFinite(count) ? count : 0 };
    })
    .filter((row): row is { tag: string; count: number } => row != null);
}
