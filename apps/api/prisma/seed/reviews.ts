import type { PrismaClient } from '../../src/generated/prisma';
import type { SeedCatalog } from './catalog';
import type { SeedIdentity } from './identity';

const TOUR_COMMENTS = [
  'Rehber çok ilgiliydi, rota akıcı geçti. Tekrar tercih ederim.',
  'Organizasyon profesyoneldi; transfer ve konaklama sorunsuzdu.',
  'Manzara harikaydı. Küçük grup olduğu için daha keyifliydi.',
  'Fiyat/performans dengesi iyi. Kahvaltılar doyurucuydu.',
  'Çocuklarla rahat gezildi, tempo uygundu.',
  'Gün batımı molası favorimiz oldu. Teşekkürler turta.',
  'Otobüs temiz ve konforluydu. Şoför dikkatli sürdü.',
  'Acentenin iletişimi hızlıydı; son dakika sorularımıza cevap geldi.',
] as const;

const EXPERIENCE_COMMENTS = [
  'Atölye keyifliydi, usta sabırla anlattı.',
  'Süre idealdi; fotoğraf için güzel ışık vardı.',
  'Küçük grup avantajı hissedildi, tavsiye ederim.',
  'Toplanma noktası net, başlangıç saatinde başladık.',
  'Ekipman kaliteliydi, güvenlik brifingi yeterliydi.',
] as const;

type ReviewAgg = {
  sum: number;
  count: number;
  guideSum: number;
  guideCount: number;
  transportSum: number;
  transportCount: number;
  accommodationSum: number;
  accommodationCount: number;
  operatorSum: number;
  operatorCount: number;
};

function emptyAgg(): ReviewAgg {
  return {
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
}

function avg(sum: number, count: number) {
  if (count === 0) return 0;
  return Math.round((sum / count) * 100) / 100;
}

/**
 * Customer reviews — architecture: COMPLETED reservation → Review (1:1) →
 * TourMetrics / Tour.averageRating mirror (Outbox worker path simulated in seed).
 */
export async function seedCustomerReviews(
  prisma: PrismaClient,
  identity: SeedIdentity,
  catalog: SeedCatalog,
): Promise<{ tourReviews: number; experienceReviews: number }> {
  let tourReviews = 0;
  let experienceReviews = 0;
  const tourAgg = new Map<string, ReviewAgg>();
  const agencyAgg = new Map<string, { sum: number; count: number }>();

  // Her acentenin tüm demo turlarına doğrulanmış yorum — özet count ile liste tutarlı kalsın
  for (
    let agencyIndex = 0;
    agencyIndex < identity.agencies.length;
    agencyIndex++
  ) {
    const agency = identity.agencies[agencyIndex];
    const agencyTours = catalog.tours.filter(
      (tour) => tour.agencyId === agency.id,
    );
    const guide = identity.guides[agencyIndex];
    const bus = identity.busCompanies[agencyIndex];

    for (let tourIndex = 0; tourIndex < agencyTours.length; tourIndex++) {
      const tour = agencyTours[tourIndex];
      const reviewsForTour = tourIndex === 0 ? 3 : tourIndex < 3 ? 2 : 3;

      for (let r = 0; r < reviewsForTour; r++) {
        const customer =
          identity.customers[
            (agencyIndex + tourIndex + r) % identity.customers.length
          ];
        // Alt puanlar önce; genel puan 6 kategorinin yuvarlanmış ortalaması
        const base = 3 + ((agencyIndex + tourIndex + r) % 3); // 3–5
        const guideRating = Math.min(5, base + (r % 2));
        const transportRating = Math.max(3, base - (r % 2));
        const accommodationRating = base;
        const hotelRating = base;
        const operatorRating = Math.min(5, base + ((r + 1) % 2));
        const routeRating = base;
        const foodRating = Math.max(3, base - 1);
        const rating = Math.round(
          (guideRating +
            operatorRating +
            routeRating +
            foodRating +
            hotelRating +
            transportRating) /
            6,
        );
        const bookingNumber = `SEEDREV${String(1000 + tourReviews + 1).padStart(4, '0')}`;

        const reservation = await prisma.reservation.create({
          data: {
            bookingNumber,
            userId: customer.id,
            tourId: tour.id,
            tourDateId: tour.tourDateId,
            agencyId: agency.id,
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            paymentMethod: 'CARD',
            adults: 2,
            children: 0,
            totalAmount: tour.price,
            boardingPickupPointId: tour.pickupPointId,
            contactEmail: customer.email,
            contactPhone: '+905551000000',
            startDate: new Date(Date.now() - (14 + r) * 86400000),
            endDate: new Date(Date.now() - (10 + r) * 86400000),
          },
        });

        await prisma.reservationGuest.create({
          data: {
            reservationId: reservation.id,
            fullName: `${customer.email.split('@')[0]} Misafir`,
            identityNumber: `3000000${String(1000 + tourReviews).padStart(4, '0')}`,
            birthDate: new Date('1988-04-12'),
            isChild: false,
            sortOrder: 0,
          },
        });

        await prisma.voucher.create({
          data: {
            reservationId: reservation.id,
            code: `VCH-REV-${tourReviews + 1}`,
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
            conversationId: `seed-rev-conv-${tourReviews + 1}`,
            paidAt: new Date(Date.now() - (12 + r) * 86400000),
          },
        });

        await prisma.invoice.create({
          data: {
            reservationId: reservation.id,
            paymentTransactionId: payment.id,
            userId: customer.id,
            agencyId: agency.id,
            amount: tour.price,
            currency: 'TRY',
            status: 'ISSUED',
            provider: 'MOCK',
            buyerSnapshot: { email: customer.email },
            sellerSnapshot: {
              agencyId: agency.id,
              legalTitle: agency.companyName,
            },
            linesSnapshot: [
              { title: tour.slug, quantity: 2, unitPrice: tour.price / 2 },
            ],
            issuedAt: new Date(),
          },
        });

        const withReply = r === 0;
        await prisma.review.create({
          data: {
            targetType: 'TOUR',
            tourId: tour.id,
            reservationId: reservation.id,
            userId: customer.id,
            agencyId: agency.id,
            guideId: guide.id,
            busCompanyId: bus.id,
            rating,
            comment: TOUR_COMMENTS[(tourReviews + r) % TOUR_COMMENTS.length],
            guideRating,
            transportRating,
            accommodationRating,
            hotelRating,
            operatorRating,
            routeRating,
            foodRating,
            guideFeedback: 'Rehber bilgilendiriciydi.',
            transportFeedback: 'Ulaşım zamanında ve temizdi.',
            accommodationFeedback: 'Konaklama paketle uyumluydu.',
            agencyReply: withReply
              ? 'Yorumunuz için teşekkürler — sizi tekrar ağırlamaktan mutluluk duyarız.'
              : null,
            agencyRepliedAt: withReply ? new Date() : null,
            partnerReply: withReply
              ? 'Yorumunuz için teşekkürler — sizi tekrar ağırlamaktan mutluluk duyarız.'
              : null,
            partnerRepliedAt: withReply ? new Date() : null,
            createdAt: new Date(Date.now() - (9 + r) * 86400000),
          },
        });

        const agg = tourAgg.get(tour.id) ?? emptyAgg();
        agg.sum += rating;
        agg.count += 1;
        agg.guideSum += guideRating;
        agg.guideCount += 1;
        agg.transportSum += transportRating;
        agg.transportCount += 1;
        agg.accommodationSum += accommodationRating;
        agg.accommodationCount += 1;
        agg.operatorSum += operatorRating;
        agg.operatorCount += 1;
        tourAgg.set(tour.id, agg);

        const aAgg = agencyAgg.get(agency.id) ?? { sum: 0, count: 0 };
        aAgg.sum += rating;
        aAgg.count += 1;
        agencyAgg.set(agency.id, aAgg);

        tourReviews += 1;
      }
    }
  }

  // Experience reviews (COMPLETED experience reservations)
  const experienceAgg = new Map<string, { sum: number; count: number }>();

  for (
    let agencyIndex = 0;
    agencyIndex < identity.agencies.length;
    agencyIndex++
  ) {
    const agency = identity.agencies[agencyIndex];
    const experiences = catalog.experiences.filter(
      (experience) => experience.agencyId === agency.id,
    );
    for (let e = 0; e < Math.min(2, experiences.length); e++) {
      const experience = experiences[e];
      const customer =
        identity.customers[(agencyIndex + e) % identity.customers.length];
      const rating = 4 + ((agencyIndex + e) % 2);
      const bookingNumber = `SEEDXREV${String(100 + experienceReviews + 1).padStart(3, '0')}`;

      const reservation = await prisma.reservation.create({
        data: {
          bookingNumber,
          userId: customer.id,
          experienceId: experience.id,
          activityDateId: experience.activityDateId,
          agencyId: agency.id,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paymentMethod: 'CARD',
          adults: 1,
          children: 0,
          totalAmount: experience.price,
          contactEmail: customer.email,
          startDate: new Date(Date.now() - 20 * 86400000),
          endDate: new Date(Date.now() - 20 * 86400000),
        },
      });

      await prisma.reservationGuest.create({
        data: {
          reservationId: reservation.id,
          fullName: `Deneyim Misafir ${experienceReviews + 1}`,
          identityNumber: `3100000${String(100 + experienceReviews).padStart(4, '0')}`,
          isChild: false,
          sortOrder: 0,
        },
      });

      const payment = await prisma.paymentTransaction.create({
        data: {
          reservationId: reservation.id,
          amount: experience.price,
          currency: 'TRY',
          status: 'SUCCESS',
          method: 'CARD',
          provider: 'MOCK',
          conversationId: `seed-xrev-conv-${experienceReviews + 1}`,
          paidAt: new Date(),
        },
      });

      await prisma.invoice.create({
        data: {
          reservationId: reservation.id,
          paymentTransactionId: payment.id,
          userId: customer.id,
          agencyId: agency.id,
          amount: experience.price,
          currency: 'TRY',
          status: 'ISSUED',
          provider: 'MOCK',
          buyerSnapshot: { email: customer.email },
          sellerSnapshot: {
            agencyId: agency.id,
            legalTitle: agency.companyName,
          },
          linesSnapshot: [
            {
              title: experience.slug,
              quantity: 1,
              unitPrice: experience.price,
            },
          ],
          issuedAt: new Date(),
        },
      });

      await prisma.review.create({
        data: {
          targetType: 'EXPERIENCE',
          experienceId: experience.id,
          reservationId: reservation.id,
          userId: customer.id,
          agencyId: agency.id,
          rating,
          comment:
            EXPERIENCE_COMMENTS[experienceReviews % EXPERIENCE_COMMENTS.length],
          operatorRating: rating,
          createdAt: new Date(Date.now() - (8 + e) * 86400000),
        },
      });

      const eAgg = experienceAgg.get(experience.id) ?? { sum: 0, count: 0 };
      eAgg.sum += rating;
      eAgg.count += 1;
      experienceAgg.set(experience.id, eAgg);

      const aAgg = agencyAgg.get(agency.id) ?? { sum: 0, count: 0 };
      aAgg.sum += rating;
      aAgg.count += 1;
      agencyAgg.set(agency.id, aAgg);

      experienceReviews += 1;
    }
  }

  for (const [experienceId, agg] of experienceAgg) {
    await prisma.experience.update({
      where: { id: experienceId },
      data: {
        averageRating: avg(agg.sum, agg.count),
        reviewCount: agg.count,
      },
    });
  }

  // Mirror TourMetrics + Tour (simulates ReviewCreated → outbox worker)
  for (const [tourId, agg] of tourAgg) {
    const averageRating = avg(agg.sum, agg.count);
    await prisma.tour.update({
      where: { id: tourId },
      data: {
        averageRating,
        reviewCount: agg.count,
      },
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

  // Yorumu olmayan turlarda katalog sahte sayaç bırakma
  for (const tour of catalog.tours) {
    if (tourAgg.has(tour.id)) continue;
    await prisma.tour.update({
      where: { id: tour.id },
      data: { averageRating: 0, reviewCount: 0 },
    });
    await prisma.tourMetrics.upsert({
      where: { tourId: tour.id },
      update: {
        reviewCount: 0,
        averageRating: 0,
        averageGuideRating: 0,
        averageTransportRating: 0,
        averageAccommodationRating: 0,
        averageOperatorRating: 0,
        lastReviewAt: null,
      },
      create: {
        tourId: tour.id,
        reviewCount: 0,
        averageRating: 0,
      },
    });
  }

  for (const [agencyId, agg] of agencyAgg) {
    await prisma.agency.update({
      where: { id: agencyId },
      data: {
        averageRating: avg(agg.sum, agg.count),
        reviewCount: agg.count,
      },
    });
  }

  return { tourReviews, experienceReviews };
}
