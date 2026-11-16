import type { PrismaClient } from '../../src/generated/prisma';
import type { SeedIdentity } from './identity';

export type PersonaCompareSeed = {
  agencies: { id: string; companyName: string }[];
  tours: { id: string; slug: string; agencyId: string; title: string }[];
};

/**
 * Likya Turizm (party/adventure) vs Ege Akademi Tur (calm/culture)
 * — compare matrix + persona review matching demos.
 */
export async function seedPersonaCompareScenario(
  prisma: PrismaClient,
  identity: SeedIdentity,
): Promise<PersonaCompareSeed> {
  const passwordHash = identity.passwordHash;
  const guide = identity.guides[0];
  const bus = identity.busCompanies[0];

  const likya = await prisma.agency.create({
    data: {
      id: 'seed-agency-likya',
      companyName: 'Likya Turizm',
      taxNumber: '3333333331',
      legalTitle: 'Likya Turizm A.Ş.',
      address: 'Kaleiçi Cad. No:12 Antalya',
      city: 'Antalya',
      country: 'Türkiye',
      contactEmail: 'owner@likya.demo.turta.com',
      contactPhone: '+902421112233',
      status: 'VERIFIED',
      sellerTier: 'GOLD',
      capabilities: ['TOURS'],
      verifiedAt: new Date(),
      tursabBelgeNo: 'A-9001',
      tursabUnvan: 'Likya Turizm A.Ş.',
      tursabCity: 'Antalya',
      tursabVerificationStatus: 'VERIFIED',
      tursabVerifiedAt: new Date(),
      averageRating: 4.4,
      reviewCount: 4,
    },
  });

  await prisma.agencyStaff.create({
    data: {
      agencyId: likya.id,
      name: 'Likya Sahip',
      email: 'owner@likya.demo.turta.com',
      passwordHash,
      role: 'AGENCY_OWNER',
      status: 'ACTIVE',
    },
  });

  const ege = await prisma.agency.create({
    data: {
      id: 'seed-agency-ege-akademi',
      companyName: 'Ege Akademi Tur',
      taxNumber: '3333333332',
      legalTitle: 'Ege Akademi Tur A.Ş.',
      address: 'Kordon Boyu No:8 İzmir',
      city: 'İzmir',
      country: 'Türkiye',
      contactEmail: 'owner@egeakademi.demo.turta.com',
      contactPhone: '+902321112244',
      status: 'VERIFIED',
      sellerTier: 'GOLD',
      capabilities: ['TOURS'],
      verifiedAt: new Date(),
      tursabBelgeNo: 'A-9002',
      tursabUnvan: 'Ege Akademi Tur A.Ş.',
      tursabCity: 'İzmir',
      tursabVerificationStatus: 'VERIFIED',
      tursabVerifiedAt: new Date(),
      averageRating: 4.7,
      reviewCount: 4,
    },
  });

  await prisma.agencyStaff.create({
    data: {
      agencyId: ege.id,
      name: 'Ege Akademi Sahip',
      email: 'owner@egeakademi.demo.turta.com',
      passwordHash,
      role: 'AGENCY_OWNER',
      status: 'ACTIVE',
    },
  });

  const likyaTour = await prisma.tour.create({
    data: {
      id: 'seed-tour-likya-party',
      title: 'Likya Gece Eğlencesi & Macera Escape',
      slug: 'likya-gece-eglencesi-macera',
      description:
        'Gençlik ve macera odaklı Likya rotası: trekking, DJ setleri, yüksek sesli dans ve gece eğlencesi. Parti temposu sevenler için tasarlandı.',
      coverUrl:
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      ],
      price: 6790,
      category: 'ADVENTURE',
      status: 'PUBLISHED',
      durationDays: 4,
      stayKind: 'OVERNIGHT',
      destinationScope: 'DOMESTIC',
      departureCities: ['Antalya'],
      extras: {
        departureCity: ['Antalya'],
        destinations: [{ city: 'Kaş', description: 'Likya kıyısı' }],
        tourType: 'Macera / Eğlence',
        transportation: 'Otobüs + tekne',
        maxParticipants: 28,
        region: 'Antalya',
        accommodationType: 'Otel',
        entertainmentLevel: 'HIGH',
        tempo: 'PARTY',
        includes: ['Kahvaltı', 'Gece DJ seti', 'Trekking rehberi'],
        cancellationPolicy: 'Kalkıştan 7 gün önce ücretsiz iptal',
      },
      childMaxAge: 12,
      minParticipants: 4,
      featured: true,
      averageRating: 4.1,
      reviewCount: 4,
      agencyId: likya.id,
    },
  });

  const egeTour = await prisma.tour.create({
    data: {
      id: 'seed-tour-ege-calm',
      title: 'Ege Kültür & Sakin Dinlenme Rotası',
      slug: 'ege-kultur-sakin-dinlenme',
      description:
        'Müze, gastronomi ve huzurlu kıyı molaları. Sakin tempo, kültür ağırlıklı program; yüksek sesli gece eğlencesi yok.',
      coverUrl:
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
      ],
      price: 5490,
      category: 'CULTURAL',
      status: 'PUBLISHED',
      durationDays: 3,
      stayKind: 'OVERNIGHT',
      destinationScope: 'DOMESTIC',
      departureCities: ['İzmir'],
      extras: {
        departureCity: ['İzmir'],
        destinations: [{ city: 'Foça', description: 'Ege kıyısı' }],
        tourType: 'Kültür Turu',
        transportation: 'Otobüs',
        maxParticipants: 18,
        region: 'İzmir',
        accommodationType: 'Butik otel',
        entertainmentLevel: 'LOW',
        tempo: 'CALM',
        includes: ['Müze girişi', 'Yerel lezzet tadımı', 'Rehber'],
        cancellationPolicy: 'Kalkıştan 5 gün önce ücretsiz iptal',
      },
      childMaxAge: 12,
      minParticipants: 2,
      featured: true,
      averageRating: 4.8,
      reviewCount: 4,
      agencyId: ege.id,
    },
  });

  const startLikya = new Date();
  startLikya.setUTCDate(startLikya.getUTCDate() + 21);
  startLikya.setUTCHours(0, 0, 0, 0);
  const endLikya = new Date(startLikya);
  endLikya.setUTCDate(endLikya.getUTCDate() + 3);

  const likyaDate = await prisma.tourDate.create({
    data: {
      tourId: likyaTour.id,
      startDate: startLikya,
      endDate: endLikya,
      capacity: 28,
      remainingCapacity: 20,
      isActive: true,
      guideId: guide?.id,
      busCompanyId: bus?.id,
      vehicleId: bus?.vehicleId,
    },
  });

  const startEge = new Date();
  startEge.setUTCDate(startEge.getUTCDate() + 28);
  startEge.setUTCHours(0, 0, 0, 0);
  const endEge = new Date(startEge);
  endEge.setUTCDate(endEge.getUTCDate() + 2);

  const egeDate = await prisma.tourDate.create({
    data: {
      tourId: egeTour.id,
      startDate: startEge,
      endDate: endEge,
      capacity: 18,
      remainingCapacity: 14,
      isActive: true,
      guideId: guide?.id,
      busCompanyId: bus?.id,
      vehicleId: bus?.vehicleId,
    },
  });

  const likyaPickup = await prisma.tourPickupPoint.create({
    data: {
      tourId: likyaTour.id,
      city: 'Antalya',
      location: 'Antalya Otogar',
      time: '07:30',
      description: 'Ana biniş',
      order: 0,
      isFixedOrigin: true,
    },
  });

  const egePickup = await prisma.tourPickupPoint.create({
    data: {
      tourId: egeTour.id,
      city: 'İzmir',
      location: 'İzmir Otogar',
      time: '08:00',
      description: 'Ana biniş',
      order: 0,
      isFixedOrigin: true,
    },
  });

  await prisma.tourAccommodation.create({
    data: {
      tourId: likyaTour.id,
      dayNumber: 1,
      nights: 3,
      name: 'Kaş Beach Party Hotel',
      image:
        likyaTour.coverUrl ??
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
      location: 'Kaş',
      type: 'Otel',
      rating: 4,
      features: ['Havuz bar', 'Gece müzik'],
      description: 'Eğlence odaklı konaklama.',
    },
  });

  await prisma.tourAccommodation.create({
    data: {
      tourId: egeTour.id,
      dayNumber: 1,
      nights: 2,
      name: 'Foça Butik Konak',
      image:
        egeTour.coverUrl ??
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
      location: 'Foça',
      type: 'Butik otel',
      rating: 5,
      features: ['Sessiz oda', 'Bahçe'],
      description: 'Sakin dinlenme odaklı konaklama.',
    },
  });

  const likyaReviews: { rating: number; comment: string }[] = [
    {
      rating: 5,
      comment:
        'Parti ve dans inanılmazdı, yüksek sesli gece eğlencesi tam aradığımız gibiydi!',
    },
    {
      rating: 1,
      comment:
        'Yüksek sesli dans ve gece eğlencesi çok yorucu; sakin dinlenme bekliyordum, uyuyamadık.',
    },
    {
      rating: 5,
      comment:
        'Macera trekking + DJ seti mükemmel kombinasyon, gençlik grubu için ideal.',
    },
    {
      rating: 2,
      comment:
        'Çocuklu aile olarak gece hayatı temposu bizi rahatsız etti, parti çok yoğundu.',
    },
  ];

  const egeReviews: { rating: number; comment: string }[] = [
    {
      rating: 5,
      comment:
        'Sakin dinlenme ve kültür rotası harikaydı; müzeler ve huzurlu kıyı molaları mükemmel.',
    },
    {
      rating: 2,
      comment:
        'Gece eğlencesi ve parti yoktu, dans bekliyordum — tempo fazla sakin geldi.',
    },
    {
      rating: 5,
      comment:
        'Çocuklarla rahat gezildi, sakin tempo ve ailece keyif aldık. Bütçe dostu da.',
    },
    {
      rating: 4,
      comment:
        'Gastronomi ve tarih rehberi çok iyiydi; sessiz, rahat bir kaçış oldu.',
    },
  ];

  async function seedReviewsForTour(input: {
    tourId: string;
    tourDateId: string;
    agencyId: string;
    pickupId: string;
    price: number;
    slug: string;
    companyName: string;
    reviews: { rating: number; comment: string }[];
    bookingPrefix: string;
  }) {
    for (let i = 0; i < input.reviews.length; i++) {
      const customer = identity.customers[i % identity.customers.length];
      const review = input.reviews[i];
      const bookingNumber = `${input.bookingPrefix}${String(i + 1).padStart(2, '0')}`;

      const reservation = await prisma.reservation.create({
        data: {
          bookingNumber,
          userId: customer.id,
          tourId: input.tourId,
          tourDateId: input.tourDateId,
          agencyId: input.agencyId,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paymentMethod: 'CARD',
          adults: 2,
          children: 0,
          totalAmount: input.price,
          boardingPickupPointId: input.pickupId,
          contactEmail: customer.email,
          contactPhone: '+905551000000',
          startDate: new Date(Date.now() - (30 + i) * 86400000),
          endDate: new Date(Date.now() - (26 + i) * 86400000),
        },
      });

      await prisma.reservationGuest.create({
        data: {
          reservationId: reservation.id,
          fullName: `${customer.email.split('@')[0]} Persona`,
          identityNumber:
            input.bookingPrefix === 'SEEDLIKYA'
              ? `4100000${String(100 + i).padStart(3, '0')}`
              : `4200000${String(100 + i).padStart(3, '0')}`,
          birthDate: new Date('1990-06-01'),
          isChild: false,
          sortOrder: 0,
        },
      });

      await prisma.voucher.create({
        data: {
          reservationId: reservation.id,
          code: `VCH-PER-${input.bookingPrefix}-${i + 1}`,
        },
      });

      const payment = await prisma.paymentTransaction.create({
        data: {
          reservationId: reservation.id,
          amount: input.price,
          currency: 'TRY',
          status: 'SUCCESS',
          method: 'CARD',
          provider: 'MOCK',
          conversationId: `seed-persona-${input.bookingPrefix}-${i + 1}`,
          paidAt: new Date(Date.now() - (28 + i) * 86400000),
        },
      });

      await prisma.invoice.create({
        data: {
          reservationId: reservation.id,
          paymentTransactionId: payment.id,
          userId: customer.id,
          agencyId: input.agencyId,
          amount: input.price,
          currency: 'TRY',
          status: 'ISSUED',
          provider: 'MOCK',
          buyerSnapshot: { email: customer.email },
          sellerSnapshot: {
            agencyId: input.agencyId,
            legalTitle: input.companyName,
          },
          linesSnapshot: [
            { title: input.slug, quantity: 2, unitPrice: input.price / 2 },
          ],
          issuedAt: new Date(),
        },
      });

      await prisma.review.create({
        data: {
          targetType: 'TOUR',
          tourId: input.tourId,
          reservationId: reservation.id,
          userId: customer.id,
          agencyId: input.agencyId,
          guideId: guide?.id,
          busCompanyId: bus?.id,
          rating: review.rating,
          comment: review.comment,
          guideRating: review.rating,
          transportRating: Math.max(3, review.rating - 1),
          accommodationRating: review.rating,
          operatorRating: review.rating,
          routeRating: review.rating,
          foodRating: Math.max(3, review.rating - 1),
        },
      });
    }
  }

  await seedReviewsForTour({
    tourId: likyaTour.id,
    tourDateId: likyaDate.id,
    agencyId: likya.id,
    pickupId: likyaPickup.id,
    price: 6790,
    slug: likyaTour.slug,
    companyName: likya.companyName,
    reviews: likyaReviews,
    bookingPrefix: 'SEEDLIKYA',
  });

  await seedReviewsForTour({
    tourId: egeTour.id,
    tourDateId: egeDate.id,
    agencyId: ege.id,
    pickupId: egePickup.id,
    price: 5490,
    slug: egeTour.slug,
    companyName: ege.companyName,
    reviews: egeReviews,
    bookingPrefix: 'SEEDEGE',
  });

  return {
    agencies: [
      { id: likya.id, companyName: likya.companyName },
      { id: ege.id, companyName: ege.companyName },
    ],
    tours: [
      {
        id: likyaTour.id,
        slug: likyaTour.slug,
        agencyId: likya.id,
        title: likyaTour.title,
      },
      {
        id: egeTour.id,
        slug: egeTour.slug,
        agencyId: ege.id,
        title: egeTour.title,
      },
    ],
  };
}
