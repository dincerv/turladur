import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';

import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class TourMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Recalc TourMetrics + mirror Tour.averageRating / reviewCount (+ agency). */
  async rebuildForTour(tourId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
      select: { agencyId: true },
    });

    const reviews = await this.prisma.review.findMany({
      where: { tourId, deletedAt: null },
      select: {
        rating: true,
        guideRating: true,
        transportRating: true,
        accommodationRating: true,
        operatorRating: true,
        routeRating: true,
        foodRating: true,
        tags: true,
        createdAt: true,
      },
    });

    const reviewCount = reviews.length;
    const averageRating = avgOf(reviews.map((r) => r.rating));
    const averageGuideRating = avgOfNullable(reviews.map((r) => r.guideRating));
    const averageTransportRating = avgOfNullable(
      reviews.map((r) => r.transportRating),
    );
    const averageAccommodationRating = avgOfNullable(
      reviews.map((r) => r.accommodationRating),
    );
    const averageOperatorRating = avgOfNullable(
      reviews.map((r) => r.operatorRating),
    );
    const averageRouteRating = avgOfNullable(reviews.map((r) => r.routeRating));
    const averageFoodRating = avgOfNullable(reviews.map((r) => r.foodRating));
    const lastReviewAt =
      reviews.length > 0
        ? reviews.reduce(
            (max, row) => (row.createdAt > max ? row.createdAt : max),
            reviews[0].createdAt,
          )
        : null;
    const topTags = topTagsFromReviews(reviews.map((r) => r.tags ?? []));

    await this.prisma.tourMetrics.upsert({
      where: { tourId },
      create: {
        tourId,
        reviewCount,
        averageRating: decimalOrZero(averageRating),
        averageGuideRating: decimalOrZero(averageGuideRating),
        averageTransportRating: decimalOrZero(averageTransportRating),
        averageAccommodationRating: decimalOrZero(averageAccommodationRating),
        averageOperatorRating: nullableDecimal(averageOperatorRating),
        averageRouteRating: nullableDecimal(averageRouteRating),
        averageFoodRating: nullableDecimal(averageFoodRating),
        topTags,
        lastReviewAt,
      },
      update: {
        reviewCount,
        averageRating: decimalOrZero(averageRating),
        averageGuideRating: decimalOrZero(averageGuideRating),
        averageTransportRating: decimalOrZero(averageTransportRating),
        averageAccommodationRating: decimalOrZero(averageAccommodationRating),
        averageOperatorRating: nullableDecimal(averageOperatorRating),
        averageRouteRating: nullableDecimal(averageRouteRating),
        averageFoodRating: nullableDecimal(averageFoodRating),
        topTags,
        lastReviewAt,
        deletedAt: null,
      },
    });

    await this.prisma.tour.update({
      where: { id: tourId },
      data: {
        averageRating: decimalOrZero(averageRating),
        reviewCount,
      },
    });

    if (tour?.agencyId) {
      await this.rebuildForAgency(tour.agencyId);
    }

    return {
      tourId,
      reviewCount,
      averageRating: Number(averageRating ?? 0).toFixed(2),
    };
  }

  async rebuildForAgency(agencyId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { agencyId, deletedAt: null },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        averageRating: decimalOrZero(agg._avg.rating),
        reviewCount: agg._count._all,
      },
    });
  }
}

function avgOf(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function avgOfNullable(
  values: Array<number | null | undefined>,
): number | null {
  const nums = values.filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n),
  );
  if (nums.length === 0) return null;
  return avgOf(nums);
}

function topTagsFromReviews(
  tagLists: string[][],
): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const list of tagLists) {
    for (const raw of list) {
      const tag = raw.trim();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'tr'))
    .slice(0, 8);
}

function decimalOrZero(value: number | null | undefined): Prisma.Decimal {
  return new Prisma.Decimal(Number(value ?? 0).toFixed(2));
}

function nullableDecimal(
  value: number | null | undefined,
): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;
  return new Prisma.Decimal(Number(value).toFixed(2));
}
