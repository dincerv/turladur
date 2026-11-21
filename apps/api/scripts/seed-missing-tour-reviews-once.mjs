/**
 * Align Tour.reviewCount / TourMetrics with real Review rows.
 * - Tours with count>0 but 0 reviews → create sample COMPLETED reviews
 * - Tours with count=0 but orphan reviews → leave reviews (metrics sync)
 * - Expand coverage for seed tours t4/t5 that catalog faked without reviews.ts
 */
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const COMMENTS = [
  'Rehber çok ilgiliydi, rota akıcı geçti. Tekrar tercih ederim.',
  'Organizasyon profesyoneldi; transfer ve konaklama sorunsuzdu.',
  'Manzara harikaydı. Küçük grup olduğu için daha keyifliydi.',
  'Fiyat/performans dengesi iyi. Kahvaltılar doyurucuydu.',
  'Çocuklarla rahat gezildi, tempo uygundu.',
  'Gün batımı molası favorimiz oldu. Teşekkürler turta.',
];

function avg(sum, count) {
  if (!count) return 0;
  return Math.round((sum / count) * 100) / 100;
}

async function ensureCustomer() {
  const existing = await prisma.user.findFirst({
    where: { email: { startsWith: 'seed-customer' }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;
  return prisma.user.findFirst({
    where: { deletedAt: null, role: 'CUSTOMER' },
    orderBy: { createdAt: 'asc' },
  });
}

async function seedReviewsForTour(tour, customer, index) {
  const existing = await prisma.review.count({
    where: { tourId: tour.id, deletedAt: null },
  });
  if (existing > 0) {
    const rows = await prisma.review.findMany({
      where: { tourId: tour.id, deletedAt: null },
      select: {
        rating: true,
        guideRating: true,
        transportRating: true,
        accommodationRating: true,
        operatorRating: true,
      },
    });
    return rows;
  }

  const target = Math.max(3, Math.min(6, Number(tour.reviewCount) || 3));
  const tourDate = await prisma.tourDate.findFirst({
    where: { tourId: tour.id, deletedAt: null },
    orderBy: { startDate: 'asc' },
  });
  const guide = await prisma.guide.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const bus = await prisma.busCompany.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const pickup = await prisma.tourPickupPoint.findFirst({
    where: { tourId: tour.id, deletedAt: null },
  });

  const created = [];
  for (let r = 0; r < target; r++) {
    const rating = 3 + ((index + r) % 3);
    const guideRating = Math.min(5, rating + (r % 2));
    const transportRating = Math.max(3, rating - (r % 2));
    const accommodationRating = rating;
    const operatorRating = Math.min(5, rating + 1);
    const bookingNumber = `FIXREV${Date.now().toString(36)}${index}${r}`.slice(
      0,
      24,
    );

    const reservation = await prisma.reservation.create({
      data: {
        bookingNumber,
        userId: customer.id,
        tourId: tour.id,
        tourDateId: tourDate?.id ?? null,
        agencyId: tour.agencyId,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        adults: 2,
        children: 0,
        totalAmount: tour.price,
        boardingPickupPointId: pickup?.id ?? null,
        contactEmail: customer.email,
        contactPhone: '+905551000000',
        startDate: new Date(Date.now() - (20 + r) * 86400000),
        endDate: new Date(Date.now() - (16 + r) * 86400000),
      },
    });

    await prisma.reservationGuest.create({
      data: {
        reservationId: reservation.id,
        fullName: `Seed Misafir ${index}-${r}`,
        identityNumber: `390${String(index).padStart(3, '0')}${String(r).padStart(4, '0')}`,
        birthDate: new Date('1990-01-15'),
        isChild: false,
        sortOrder: 0,
      },
    });

    const payment = await prisma.paymentTransaction.create({
      data: {
        reservationId: reservation.id,
        amount: tour.price,
        currency: 'TRY',
        status: 'SUCCESS',
        method: 'CARD',
        provider: 'MOCK',
        conversationId: `fix-rev-${bookingNumber}`,
        paidAt: new Date(Date.now() - (18 + r) * 86400000),
      },
    });

    await prisma.invoice.create({
      data: {
        reservationId: reservation.id,
        paymentTransactionId: payment.id,
        userId: customer.id,
        agencyId: tour.agencyId,
        amount: tour.price,
        currency: 'TRY',
        status: 'ISSUED',
        provider: 'MOCK',
        buyerSnapshot: { email: customer.email },
        sellerSnapshot: { agencyId: tour.agencyId },
        linesSnapshot: [
          { title: tour.slug, quantity: 1, unitPrice: tour.price },
        ],
        issuedAt: new Date(),
      },
    });

    const review = await prisma.review.create({
      data: {
        targetType: 'TOUR',
        tourId: tour.id,
        reservationId: reservation.id,
        userId: customer.id,
        agencyId: tour.agencyId,
        guideId: guide?.id ?? null,
        busCompanyId: bus?.id ?? null,
        rating,
        comment: COMMENTS[(index + r) % COMMENTS.length],
        guideRating,
        transportRating,
        accommodationRating,
        operatorRating,
        routeRating: rating,
        foodRating: Math.max(3, rating - 1),
        travelerContext: r % 2 === 0 ? 'COUPLE' : 'FAMILY',
        tags: r === 0 ? ['rehber', 'organizasyon'] : ['manzara'],
        agencyReply:
          r === 0
            ? 'Yorumunuz için teşekkürler — sizi tekrar ağırlamaktan mutluluk duyarız.'
            : null,
        agencyRepliedAt: r === 0 ? new Date() : null,
        partnerReply:
          r === 0
            ? 'Yorumunuz için teşekkürler — sizi tekrar ağırlamaktan mutluluk duyarız.'
            : null,
        partnerRepliedAt: r === 0 ? new Date() : null,
        createdAt: new Date(Date.now() - (10 + r) * 86400000),
      },
    });
    created.push(review);
  }
  return created;
}

async function syncMetrics(tourId, rows) {
  const agg = {
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
  for (const row of rows) {
    agg.sum += Number(row.rating);
    agg.count += 1;
    if (row.guideRating != null) {
      agg.guideSum += Number(row.guideRating);
      agg.guideCount += 1;
    }
    if (row.transportRating != null) {
      agg.transportSum += Number(row.transportRating);
      agg.transportCount += 1;
    }
    if (row.accommodationRating != null) {
      agg.accommodationSum += Number(row.accommodationRating);
      agg.accommodationCount += 1;
    }
    if (row.operatorRating != null) {
      agg.operatorSum += Number(row.operatorRating);
      agg.operatorCount += 1;
    }
  }

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

async function main() {
  const customer = await ensureCustomer();
  if (!customer) {
    console.error('No customer user found');
    process.exit(1);
  }

  const tours = await prisma.tour.findMany({
    where: {
      deletedAt: null,
      OR: [
        { reviewCount: { gt: 0 } },
        { slug: { contains: 'trabzon' } },
        { slug: { contains: 'nev' } },
        { title: { contains: 'Kapadokya' } },
        { title: { contains: 'Karadeniz' } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      agencyId: true,
      reviewCount: true,
    },
    orderBy: { slug: 'asc' },
  });

  let fixed = 0;
  let synced = 0;
  for (let i = 0; i < tours.length; i++) {
    const tour = tours[i];
    const before = await prisma.review.count({
      where: { tourId: tour.id, deletedAt: null },
    });
    const rows = await seedReviewsForTour(tour, customer, i);
    if (before === 0 && rows.length > 0) {
      console.log(`seeded ${tour.slug} → ${rows.length}`);
      fixed += 1;
    }
    await syncMetrics(tour.id, rows);
    synced += 1;
  }

  // Zero out published tours that still have fake counts with no reviews
  const orphans = await prisma.tour.findMany({
    where: { deletedAt: null, reviewCount: { gt: 0 } },
    select: { id: true, slug: true, reviewCount: true },
  });
  for (const tour of orphans) {
    const real = await prisma.review.count({
      where: { tourId: tour.id, deletedAt: null },
    });
    if (real === 0) {
      await prisma.tour.update({
        where: { id: tour.id },
        data: { reviewCount: 0, averageRating: 0 },
      });
      await prisma.tourMetrics.upsert({
        where: { tourId: tour.id },
        update: {
          reviewCount: 0,
          averageRating: 0,
          averageGuideRating: null,
          averageTransportRating: null,
          averageAccommodationRating: null,
          averageOperatorRating: null,
        },
        create: {
          tourId: tour.id,
          reviewCount: 0,
          averageRating: 0,
        },
      });
      console.log(`zeroed ${tour.slug}`);
    }
  }

  console.log(JSON.stringify({ tours: tours.length, fixed, synced }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
