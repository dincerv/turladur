/**
 * One-off: COMPLETED reservations + persona-tagged reviews for
 * KARADENİZ VE BATUM TURU (live smoke for AI persona matching).
 *
 * Run: railway run -s api -e production -- pnpm --filter api exec tsx scripts/seed-karadeniz-reviews.ts
 */
import { PrismaClient } from '../src/generated/prisma';

const TOUR_IDS = (
  process.env.SEED_TOUR_IDS ??
  process.env.SEED_TOUR_ID ??
  'cmwmb937u000dml01nqku8ys0'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const REVIEWS: Array<{
  rating: number;
  comment: string;
  guideRating: number;
  valueRating: number;
  transportRating: number;
  accommodationRating: number;
  travelerContext: 'SOLO' | 'COUPLE' | 'FAMILY' | 'FRIENDS';
  tags: string[];
}> = [
  {
    rating: 5,
    comment:
      'Sakin dinlenme arayanlar için ideal. Huzur dolu yayla molaları, sessiz konaklama ve rahat tempo. Uzungöl gün batımı favorimiz oldu.',
    guideRating: 5,
    valueRating: 5,
    transportRating: 4,
    accommodationRating: 5,
    travelerContext: 'COUPLE',
    tags: ['Otel merkeziydi', 'Rehber çok ilgiliydi'],
  },
  {
    rating: 5,
    comment:
      'Rehber kültür ve tarih anlatımlarıyla turu zenginleştirdi; müze ve eski sokaklar çok keyifliydi. Gastronomi molaları da başarılı.',
    guideRating: 5,
    valueRating: 4,
    transportRating: 5,
    accommodationRating: 4,
    travelerContext: 'FRIENDS',
    tags: ['Rehber çok ilgiliydi', 'Ekstra ücret sürprizi yok'],
  },
  {
    rating: 4,
    comment:
      'Doğa yürüyüşü ve hafif macera sevenler için Ayder etabı güzeldi. Trekking temposu zorlu değildi ama adrenalini hissettirdi.',
    guideRating: 4,
    valueRating: 4,
    transportRating: 4,
    accommodationRating: 4,
    travelerContext: 'SOLO',
    tags: ['Araç tertemizdi', 'Program sıkışıktı'],
  },
  {
    rating: 3,
    comment:
      'Gece eğlence / parti temposu bekleyenler için sakin kaçtı. Yüksek sesli müzik yoktu; eğlence yoğun değildi. Biz sakin istedik, sorun olmadı.',
    guideRating: 4,
    valueRating: 3,
    transportRating: 3,
    accommodationRating: 4,
    travelerContext: 'FRIENDS',
    tags: ['Otobüs dardı', 'Serbest zaman azdı'],
  },
  {
    rating: 5,
    comment:
      'Çocuklarla ailece rahat gezildi. Bebek arabası için mola noktaları iyiydi, tempo yavaş ve keyifliydi. Fiyat/performans da uygundu, bütçe dostu.',
    guideRating: 5,
    valueRating: 5,
    transportRating: 4,
    accommodationRating: 5,
    travelerContext: 'FAMILY',
    tags: ['Ekstra ücret sürprizi yok', 'Otel merkeziydi'],
  },
  {
    rating: 4,
    comment:
      'Organizasyon profesyoneldi. Otobüs temiz, şoför dikkatli. Ekonomik ve uygun fiyat arayanlara öneririm.',
    guideRating: 4,
    valueRating: 5,
    transportRating: 5,
    accommodationRating: 4,
    travelerContext: 'COUPLE',
    tags: ['Araç tertemizdi', 'Ekstra ücret sürprizi yok'],
  },
];

async function ensureCustomers(prisma: PrismaClient, needed: number) {
  let customers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: { endsWith: '@demo.turta.com' },
      role: 'CUSTOMER',
    },
    take: needed,
    orderBy: { email: 'asc' },
  });

  while (customers.length < needed) {
    const n = customers.length + 1;
    const email = `reviewer${String(n).padStart(2, '0')}@demo.turta.com`;
    const existing = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      customers.push(existing);
      continue;
    }
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: 'seed-only-not-for-login',
        role: 'CUSTOMER',
        firstName: 'Yorum',
        lastName: `Test${n}`,
      },
    });
    customers.push(created);
    console.log(`+ created customer ${email}`);
  }
  return customers.slice(0, needed);
}

async function seedTour(
  prisma: PrismaClient,
  tourId: string,
  customers: Awaited<ReturnType<typeof ensureCustomers>>,
) {
  const tour = await prisma.tour.findFirst({
    where: { id: tourId, deletedAt: null },
    include: {
      dates: {
        where: { deletedAt: null },
        orderBy: { startDate: 'asc' },
        take: 1,
      },
    },
  });
  if (!tour) throw new Error(`Tour not found: ${tourId}`);

  const existingCount = await prisma.review.count({
    where: { tourId: tour.id, deletedAt: null },
  });
  if (existingCount >= REVIEWS.length) {
    const existing = await prisma.review.findMany({
      where: { tourId: tour.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: REVIEWS.length,
    });
    for (let i = 0; i < existing.length; i++) {
      const row = REVIEWS[i];
      await prisma.review.update({
        where: { id: existing[i].id },
        data: {
          guideRating: row.guideRating,
          operatorRating: row.valueRating,
          transportRating: row.transportRating,
          accommodationRating: row.accommodationRating,
          travelerContext: row.travelerContext,
          tags: row.tags,
        },
      });
    }
    await rebuildMetrics(prisma, tour.id);
    console.log(
      `enriched ${tour.title} — ${existingCount} reviews + tags/context`,
    );
    return {
      tourId: tour.id,
      title: tour.title,
      reviewCount: existingCount,
      averageRating: Number(tour.averageRating),
      skipped: true,
      enriched: true,
    };
  }

  const tourDateId = tour.dates[0]?.id ?? null;
  let created = 0;
  const stamp = Date.now().toString().slice(-6);

  for (let i = 0; i < REVIEWS.length; i++) {
    const customer = customers[i];
    const row = REVIEWS[i];
    const bookingNumber = `LKR${stamp}${tour.id.slice(-4)}${i}`.slice(0, 20);

    const reservation = await prisma.reservation.create({
      data: {
        bookingNumber,
        userId: customer.id,
        tourId: tour.id,
        tourDateId,
        agencyId: tour.agencyId,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        adults: 2,
        children: i === 4 ? 1 : 0,
        totalAmount: tour.price,
        contactEmail: customer.email,
        contactPhone: '+905551112233',
        startDate: new Date(Date.now() - (21 + i) * 86400000),
        endDate: new Date(Date.now() - (17 + i) * 86400000),
      },
    });

    await prisma.review.create({
      data: {
        targetType: 'TOUR',
        tourId: tour.id,
        reservationId: reservation.id,
        userId: customer.id,
        agencyId: tour.agencyId,
        rating: row.rating,
        comment: row.comment,
        guideRating: row.guideRating,
        transportRating: row.transportRating,
        accommodationRating: row.accommodationRating,
        operatorRating: row.valueRating,
        travelerContext: row.travelerContext,
        tags: row.tags,
      },
    });
    created += 1;
    console.log(
      `+ ${tour.title.slice(0, 32)} · ${customer.email} (${row.rating}★)`,
    );
  }

  const metrics = await rebuildMetrics(prisma, tour.id);

  return {
    tourId: tour.id,
    title: tour.title,
    reviewCount: metrics.reviewCount,
    averageRating: metrics.averageRating,
    created,
  };
}

async function rebuildMetrics(prisma: PrismaClient, tourId: string) {
  const reviews = await prisma.review.findMany({
    where: { tourId, deletedAt: null },
    select: {
      rating: true,
      guideRating: true,
      transportRating: true,
      accommodationRating: true,
      operatorRating: true,
      tags: true,
      createdAt: true,
    },
  });
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / reviewCount;
  const avg = (pick: (r: (typeof reviews)[number]) => number | null) => {
    const vals = reviews
      .map(pick)
      .filter((v): v is number => typeof v === 'number');
    if (!vals.length) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };
  const tagCounts = new Map<string, number>();
  for (const review of reviews) {
    for (const tag of review.tags ?? []) {
      const key = tag.trim();
      if (!key) continue;
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));
  const lastReviewAt =
    reviews.length > 0
      ? reviews.reduce(
          (max, row) => (row.createdAt > max ? row.createdAt : max),
          reviews[0].createdAt,
        )
      : null;

  await prisma.tourMetrics.upsert({
    where: { tourId },
    create: {
      tourId,
      reviewCount,
      averageRating,
      averageGuideRating: avg((r) => r.guideRating),
      averageTransportRating: avg((r) => r.transportRating),
      averageAccommodationRating: avg((r) => r.accommodationRating),
      averageOperatorRating: avg((r) => r.operatorRating),
      topTags,
      lastReviewAt,
    },
    update: {
      reviewCount,
      averageRating,
      averageGuideRating: avg((r) => r.guideRating),
      averageTransportRating: avg((r) => r.transportRating),
      averageAccommodationRating: avg((r) => r.accommodationRating),
      averageOperatorRating: avg((r) => r.operatorRating),
      topTags,
      lastReviewAt,
    },
  });

  await prisma.tour.update({
    where: { id: tourId },
    data: { averageRating, reviewCount },
  });

  return { reviewCount, averageRating };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const customers = await ensureCustomers(prisma, REVIEWS.length);
    const results = [];
    for (const tourId of TOUR_IDS) {
      results.push(await seedTour(prisma, tourId, customers));
    }
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
