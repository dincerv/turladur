/**
 * One-shot: seed tur görselleri + öğünler + Antalya rota durakları + yorum puan tutarlılığı.
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const MEDIA = {
  'Kapadokya Peri Bacaları': {
    coverUrl:
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'Antalya Likya Yolu': {
    coverUrl:
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'İstanbul Boğaz & Tarih': {
    coverUrl:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'Ege Gastronomi Rotası': {
    coverUrl:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'Karadeniz Yayla Escape': {
    coverUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
    ],
  },
};

/** dayIndex → meals/accommodation defaults by tour prefix */
const MEALS = {
  'Kapadokya Peri Bacaları': [
    {
      breakfast: 'EXCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Göreme — mağara / butik otel',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Göreme — mağara / butik otel',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'EXCLUDED',
      dinner: 'EXCLUDED',
      accommodation: null,
    },
  ],
  'Antalya Likya Yolu': [
    {
      breakfast: 'EXCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Patara / Kalkan — butik pansiyon',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Kaş — butik otel',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Kaş — butik otel',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'EXCLUDED',
      dinner: 'EXCLUDED',
      accommodation: null,
    },
  ],
  'İstanbul Boğaz & Tarih': [
    {
      breakfast: 'EXCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: null,
    },
  ],
  'Ege Gastronomi Rotası': [
    {
      breakfast: 'EXCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'INCLUDED',
      accommodation: 'İzmir — butik otel',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'İzmir — butik otel',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: null,
    },
  ],
  'Karadeniz Yayla Escape': [
    {
      breakfast: 'EXCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Uzungöl dağ evi',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Uzungöl dağ evi',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Ayder yayla oteli',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'EXCLUDED',
      dinner: 'EXCLUDED',
      accommodation: 'Ayder yayla oteli',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Ayder yayla oteli',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'FREE_TIME',
      accommodation: 'Ayder yayla oteli',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'FREE_TIME',
      dinner: 'EXCLUDED',
      accommodation: 'Ayder veya Çamlıhemşin konaklama',
    },
    {
      breakfast: 'INCLUDED',
      lunch: 'EXCLUDED',
      dinner: 'EXCLUDED',
      accommodation: null,
    },
  ],
};

const ANTALYA_STOPS = [
  {
    dayNumber: 1,
    name: 'Patara Antik Kent',
    description: 'Sahil ve antik tiyatro — Likya başlangıcı',
    latitude: 36.2602,
    longitude: 29.3175,
    kind: 'VISIT',
  },
  {
    dayNumber: 1,
    name: 'Patara Plajı',
    description: 'Akdeniz sahil yürüyüşü ve brifing',
    latitude: 36.2548,
    longitude: 29.3089,
    kind: 'VISIT',
  },
  {
    dayNumber: 1,
    name: 'Patara Butik Pansiyon',
    description: 'İlk gece konaklama',
    latitude: 36.2655,
    longitude: 29.3251,
    kind: 'LODGING',
  },
  {
    dayNumber: 2,
    name: 'Kaş Merkez',
    description: 'Sahil patikası sonrası Kaş’a varış',
    latitude: 36.2018,
    longitude: 29.6411,
    kind: 'VISIT',
  },
  {
    dayNumber: 2,
    name: 'Kaş Butik Otel',
    description: 'İkinci ve üçüncü gece konaklama',
    latitude: 36.1995,
    longitude: 29.6382,
    kind: 'LODGING',
  },
  {
    dayNumber: 3,
    name: 'Kekova Batık Kent',
    description: 'Tekne turu ve yüzme molası',
    latitude: 36.1862,
    longitude: 29.8514,
    kind: 'VISIT',
  },
  {
    dayNumber: 3,
    name: 'Simena (Kaleköy)',
    description: 'Kale manzarası ve serbest keşif',
    latitude: 36.1908,
    longitude: 29.8612,
    kind: 'VISIT',
  },
  {
    dayNumber: 4,
    name: 'Antalya Dönüş Noktası',
    description: 'Tur kapanışı ve bırakış',
    latitude: 36.8969,
    longitude: 30.7133,
    kind: 'VISIT',
  },
];

function matchPrefix(title, table) {
  for (const [prefix, value] of Object.entries(table)) {
    if (String(title).startsWith(prefix)) return value;
  }
  return null;
}

function mergeItineraryMeals(itinerary, mealDays) {
  if (!mealDays?.length) return itinerary;
  if (Array.isArray(itinerary)) {
    return itinerary.map((day, i) => {
      const m = mealDays[i];
      if (!m || !day || typeof day !== 'object') return day;
      return {
        ...day,
        meals: {
          breakfast: m.breakfast,
          lunch: m.lunch,
          dinner: m.dinner,
        },
        accommodation: m.accommodation,
      };
    });
  }
  if (!itinerary || typeof itinerary !== 'object') return itinerary;
  const next = { ...itinerary };
  for (let i = 0; i < mealDays.length; i++) {
    const key = `day${i}`;
    const day = next[key];
    if (!day || typeof day !== 'object') continue;
    const m = mealDays[i];
    next[key] = {
      ...day,
      meals: {
        breakfast: m.breakfast,
        lunch: m.lunch,
        dinner: m.dinner,
      },
      accommodation: m.accommodation,
    };
  }
  return next;
}

function overallFromCategories(row) {
  const vals = [
    row.guideRating,
    row.operatorRating,
    row.routeRating,
    row.foodRating,
    row.hotelRating ?? row.accommodationRating,
    row.transportRating,
  ].filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (vals.length === 0) return row.rating;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

async function main() {
  const tours = await prisma.tour.findMany({
    where: { deletedAt: null, slug: { startsWith: 'seed-tour-' } },
    select: { id: true, title: true, slug: true, extras: true },
  });

  let updatedTours = 0;
  let antalyaStops = 0;

  for (const tour of tours) {
    const media = matchPrefix(tour.title, MEDIA);
    const mealDays = matchPrefix(tour.title, MEALS);
    if (!media && !mealDays) continue;

    const prev =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? { ...tour.extras }
        : {};
    const itinerary = mergeItineraryMeals(prev.itinerary, mealDays);

    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        ...(media
          ? { coverUrl: media.coverUrl, galleryUrls: media.galleryUrls }
          : {}),
        extras: {
          ...prev,
          itinerary,
        },
      },
    });
    updatedTours += 1;

    if (String(tour.title).startsWith('Antalya Likya Yolu')) {
      const existing = await prisma.tourRouteStop.count({
        where: { tourId: tour.id, deletedAt: null },
      });
      if (existing === 0) {
        for (const [index, stop] of ANTALYA_STOPS.entries()) {
          await prisma.tourRouteStop.create({
            data: {
              tourId: tour.id,
              dayNumber: stop.dayNumber,
              order: index,
              name: stop.name,
              description: stop.description,
              latitude: stop.latitude,
              longitude: stop.longitude,
              kind: stop.kind,
            },
          });
          antalyaStops += 1;
        }
      }
    }
  }

  const reviews = await prisma.review.findMany({
    where: { targetType: 'TOUR', deletedAt: null, tourId: { not: null } },
    select: {
      id: true,
      tourId: true,
      rating: true,
      guideRating: true,
      operatorRating: true,
      routeRating: true,
      foodRating: true,
      hotelRating: true,
      accommodationRating: true,
      transportRating: true,
    },
  });

  const tourAgg = new Map();
  let fixedReviews = 0;
  for (const review of reviews) {
    const nextRating = overallFromCategories(review);
    if (nextRating !== review.rating) {
      await prisma.review.update({
        where: { id: review.id },
        data: { rating: nextRating },
      });
      fixedReviews += 1;
    }
    if (!review.tourId) continue;
    const agg = tourAgg.get(review.tourId) ?? {
      sum: 0,
      count: 0,
      guideSum: 0,
      guideCount: 0,
      transportSum: 0,
      transportCount: 0,
      accommodationSum: 0,
      accommodationCount: 0,
      operatorSum: 0,
      operatorCount: 0,
    };
    agg.sum += nextRating;
    agg.count += 1;
    if (typeof review.guideRating === 'number') {
      agg.guideSum += review.guideRating;
      agg.guideCount += 1;
    }
    if (typeof review.transportRating === 'number') {
      agg.transportSum += review.transportRating;
      agg.transportCount += 1;
    }
    const acc = review.accommodationRating ?? review.hotelRating;
    if (typeof acc === 'number') {
      agg.accommodationSum += acc;
      agg.accommodationCount += 1;
    }
    if (typeof review.operatorRating === 'number') {
      agg.operatorSum += review.operatorRating;
      agg.operatorCount += 1;
    }
    tourAgg.set(review.tourId, agg);
  }

  const avg = (sum, count) =>
    count === 0 ? 0 : Math.round((sum / count) * 100) / 100;

  for (const [tourId, agg] of tourAgg) {
    const averageRating = avg(agg.sum, agg.count);
    await prisma.tour.update({
      where: { id: tourId },
      data: { averageRating, reviewCount: agg.count },
    });
    await prisma.tourMetrics.upsert({
      where: { tourId },
      update: {
        reviewCount: agg.count,
        averageRating,
        averageGuideRating: avg(agg.guideSum, agg.guideCount),
        averageTransportRating: avg(agg.transportSum, agg.transportCount),
        averageAccommodationRating: avg(
          agg.accommodationSum,
          agg.accommodationCount,
        ),
        averageOperatorRating: avg(agg.operatorSum, agg.operatorCount),
        lastReviewAt: new Date(),
      },
      create: {
        tourId,
        reviewCount: agg.count,
        averageRating,
        averageGuideRating: avg(agg.guideSum, agg.guideCount),
        averageTransportRating: avg(agg.transportSum, agg.transportCount),
        averageAccommodationRating: avg(
          agg.accommodationSum,
          agg.accommodationCount,
        ),
        averageOperatorRating: avg(agg.operatorSum, agg.operatorCount),
        lastReviewAt: new Date(),
      },
    });
  }

  let clearedRedis = 0;
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
    const keys = await redis.keys('catalog:tour:*');
    if (keys.length) {
      await redis.del(...keys);
      clearedRedis = keys.length;
    }
    await redis.quit();
  } catch (err) {
    console.log('redis skip', String(err));
  }

  console.log(
    JSON.stringify({
      updatedTours,
      antalyaStops,
      fixedReviews,
      toursWithMetrics: tourAgg.size,
      clearedRedis,
    }),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
