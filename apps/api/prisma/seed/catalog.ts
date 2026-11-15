import type { Prisma, PrismaClient } from '../../src/generated/prisma';
import { buildSystemBusLayoutDefs } from '../../src/shared/utils/bus-seat-layout';
import {
  EXPERIENCE_TEMPLATES,
  EXPERIENCES_PER_AGENCY,
  TOUR_TEMPLATES,
  TOURS_PER_AGENCY,
} from './constants';
import type { SeedIdentity } from './identity';

export type SeedCatalog = {
  tours: {
    id: string;
    slug: string;
    agencyId: string;
    tourDateId: string;
    pickupPointId: string;
    extraId: string;
    price: number;
  }[];
  experiences: {
    id: string;
    slug: string;
    agencyId: string;
    activityDateId: string;
    price: number;
  }[];
  tags: { id: string; slug: string }[];
  hotels: { id: string; agencyId: string }[];
};

const SEED_CITY_COORDS: Record<
  string,
  { latitude: number; longitude: number }
> = {
  Nevşehir: { latitude: 38.6244, longitude: 34.7239 },
  Antalya: { latitude: 36.8969, longitude: 30.7133 },
  İstanbul: { latitude: 41.0082, longitude: 28.9784 },
  İzmir: { latitude: 38.4237, longitude: 27.1428 },
  Trabzon: { latitude: 41.0027, longitude: 39.7168 },
};

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function seedBusSeatLayouts(prisma: PrismaClient) {
  const defs = buildSystemBusLayoutDefs();
  for (const def of defs) {
    const layoutJson = def.layoutJson as unknown as Prisma.InputJsonValue;
    await prisma.busSeatLayout.upsert({
      where: { kind: def.kind },
      update: {
        name: def.name,
        passengerSeats: def.passengerSeats,
        crewSeats: def.crewSeats,
        rows: def.rows,
        cols: def.cols,
        layoutJson,
        isSystem: true,
        deletedAt: null,
      },
      create: {
        kind: def.kind,
        name: def.name,
        passengerSeats: def.passengerSeats,
        crewSeats: def.crewSeats,
        rows: def.rows,
        cols: def.cols,
        layoutJson,
        isSystem: true,
      },
    });
  }
}

export async function seedCatalog(
  prisma: PrismaClient,
  identity: SeedIdentity,
): Promise<SeedCatalog> {
  await seedBusSeatLayouts(prisma);

  const layout46 = await prisma.busSeatLayout.findUniqueOrThrow({
    where: { kind: 'BUS_46_PLUS_1' },
  });

  const tagDefs = [
    { name: 'Kapadokya', slug: 'kapadokya', kind: 'DESTINATION' as const },
    { name: 'Ege', slug: 'ege', kind: 'DESTINATION' as const },
    { name: 'Aile', slug: 'aile', kind: 'THEME' as const },
    { name: 'Macera', slug: 'macera', kind: 'THEME' as const },
    { name: 'Gastronomi', slug: 'gastronomi-tag', kind: 'THEME' as const },
  ];
  const tags: SeedCatalog['tags'] = [];
  for (const t of tagDefs) {
    const row = await prisma.tag.create({
      data: { name: t.name, slug: t.slug, kind: t.kind },
    });
    tags.push({ id: row.id, slug: row.slug });
  }

  const hotels: SeedCatalog['hotels'] = [];
  const tours: SeedCatalog['tours'] = [];
  const experiences: SeedCatalog['experiences'] = [];

  for (let a = 0; a < identity.agencies.length; a++) {
    const agency = identity.agencies[a];
    const guide = identity.guides[a];
    const bus = identity.busCompanies[a];

    for (let h = 1; h <= 2; h++) {
      const hotel = await prisma.hotel.create({
        data: {
          name: `${agency.companyName} Referans Otel ${h}`,
          slug: `seed-hotel-a${a + 1}-h${h}`,
          description: 'Tur konaklama referansı (satış yok).',
          city: TOUR_TEMPLATES[a].city,
          country: 'Türkiye',
          type: 'BOUTIQUE_HOTEL',
          stars: 3 + h,
          agencyId: agency.id,
          images: [TOUR_TEMPLATES[a % TOUR_TEMPLATES.length].coverUrl],
        },
      });
      hotels.push({ id: hotel.id, agencyId: agency.id });
    }

    for (let t = 0; t < TOURS_PER_AGENCY; t++) {
      const tmpl = TOUR_TEMPLATES[t];
      const slug = `seed-tour-a${a + 1}-t${t + 1}-${tmpl.city
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')}`;
      const cover = tmpl.coverUrl;
      const gallery = [...tmpl.galleryUrls];
      const tour = await prisma.tour.create({
        data: {
          title: `${tmpl.title} — ${agency.companyName}`,
          slug,
          description: `${tmpl.title} demo turu. ${tmpl.city} kalkışlı, ${tmpl.days} gün. Seed verisi — checkout için pickup ve yaş aralıkları dolu.`,
          coverUrl: cover,
          galleryUrls: gallery,
          price: tmpl.price + a * 100,
          category: tmpl.category,
          status: 'PUBLISHED',
          durationDays: tmpl.days,
          stayKind: tmpl.days === 1 ? 'DAY_TRIP' : 'OVERNIGHT',
          destinationScope: 'DOMESTIC',
          departureCities: [tmpl.city],
          extras: {
            departureCity: [tmpl.city],
            destinations: [{ city: tmpl.city, description: '' }],
            tourType: tmpl.days === 1 ? 'Günübirlik Tur' : 'Kültür Turu',
            transportation: 'Otobüs',
            maxParticipants: 24,
            region: tmpl.city,
            accommodationType: tmpl.days === 1 ? 'Konaklamasız' : 'Otel',
          },
          childMaxAge: 12,
          minParticipants: 2,
          featured: t === 0,
          averageRating: 4.2 + (t % 5) * 0.1,
          reviewCount: 2 + t,
          agencyId: agency.id,
        },
      });

      await prisma.tourTag.create({
        data: { tourId: tour.id, tagId: tags[t % tags.length].id },
      });

      const hotelId = hotels.find((h) => h.agencyId === agency.id)?.id;
      await prisma.tourAccommodation.create({
        data: {
          tourId: tour.id,
          dayNumber: 1,
          hotelId: hotelId ?? null,
          nights: Math.max(1, tmpl.days - 1),
          name: `${tmpl.city} Konaklama`,
          image: cover,
          location: tmpl.city,
          type: 'Otel',
          rating: 4.5,
          features: ['Kahvaltı', 'Merkezi konum'],
          description: 'Paket dahil konaklama özeti.',
        },
      });

      const pickupGeo = SEED_CITY_COORDS[tmpl.city];
      const pickupA = await prisma.tourPickupPoint.create({
        data: {
          tourId: tour.id,
          city: tmpl.city,
          location: `${tmpl.city} Otogar`,
          time: '07:00',
          description: 'Ana biniş',
          order: 0,
          isFixedOrigin: true,
          latitude: pickupGeo?.latitude,
          longitude: pickupGeo?.longitude,
        },
      });
      await prisma.tourPickupPoint.create({
        data: {
          tourId: tour.id,
          city: tmpl.city,
          location: `${tmpl.city} Meydan`,
          time: '07:30',
          description: 'İkinci durak',
          order: 1,
          latitude: pickupGeo?.latitude
            ? pickupGeo.latitude + 0.008
            : undefined,
          longitude: pickupGeo?.longitude
            ? pickupGeo.longitude + 0.006
            : undefined,
        },
      });

      const extra = await prisma.tourExtra.create({
        data: {
          tourId: tour.id,
          title: 'Tek kişilik oda farkı',
          description: 'Kişi başı',
          price: 750,
          sortOrder: 0,
        },
      });

      const ruleStart = addDays(new Date(), 14);
      const ruleEnd = addDays(new Date(), 90);
      const rule = await prisma.tourDepartureRule.create({
        data: {
          tourId: tour.id,
          rangeStart: ruleStart,
          rangeEnd: ruleEnd,
          weekdays: [1, 3, 5],
          defaultCapacity: 24,
          isActive: true,
        },
      });

      let primaryDateId = '';
      for (let d = 0; d < 2; d++) {
        const startDate = addDays(new Date(), 21 + t * 7 + d * 14 + a);
        const endDate = addDays(startDate, tmpl.days - 1);
        const capacity = 24;
        const tourDate = await prisma.tourDate.create({
          data: {
            tourId: tour.id,
            startDate,
            endDate,
            capacity,
            remainingCapacity: capacity - (d === 0 ? 2 : 0),
            isActive: true,
            departureRuleId: rule.id,
            busSeatLayoutId: layout46.id,
            ...(d === 0
              ? {
                  guideId: guide.id,
                  busCompanyId: bus.id,
                  vehicleId: bus.vehicleId,
                }
              : {}),
          },
        });
        if (d === 0) primaryDateId = tourDate.id;

        await prisma.tourDateAgeRange.createMany({
          data: [
            {
              tourDateId: tourDate.id,
              minAge: 0,
              maxAge: 12,
              pricingType: 'HALF',
              value: 50,
            },
            {
              tourDateId: tourDate.id,
              minAge: 13,
              maxAge: null,
              pricingType: 'PERCENTAGE',
              value: 0,
            },
          ],
        });

        if (d === 0) {
          await prisma.tourDateAssignment.create({
            data: {
              tourDateId: tourDate.id,
              role: 'GUIDE',
              guideId: guide.id,
              status: 'ACCEPTED',
              invitedByAgencyId: agency.id,
              invitedByAgencyStaffId: agency.ownerStaffId,
              respondedAt: new Date(),
            },
          });
          await prisma.tourDateAssignment.create({
            data: {
              tourDateId: tourDate.id,
              role: 'BUS',
              busCompanyId: bus.id,
              status: 'ACCEPTED',
              invitedByAgencyId: agency.id,
              invitedByAgencyStaffId: agency.ownerStaffId,
              respondedAt: new Date(),
            },
          });
        }
      }

      await prisma.tourMetrics.create({
        data: {
          tourId: tour.id,
          reviewCount: tour.reviewCount,
          averageRating: tour.averageRating,
          averageGuideRating: 4.5,
          averageTransportRating: 4.3,
          averageAccommodationRating: 4.4,
          lastReviewAt: new Date(),
        },
      });

      tours.push({
        id: tour.id,
        slug: tour.slug,
        agencyId: agency.id,
        tourDateId: primaryDateId,
        pickupPointId: pickupA.id,
        extraId: extra.id,
        price: Number(tour.price),
      });
    }

    for (let e = 0; e < EXPERIENCES_PER_AGENCY; e++) {
      const tmpl = EXPERIENCE_TEMPLATES[e];
      const slug = `seed-exp-a${a + 1}-e${e + 1}`;
      const image = tmpl.imageUrl;
      const gallery = [...tmpl.gallery];
      const experience = await prisma.experience.create({
        data: {
          title: `${tmpl.title} — ${agency.companyName}`,
          slug,
          description: `${tmpl.title} kısa açıklama.`,
          longDescription: `${tmpl.title} detaylı seed içeriği. Konum: ${tmpl.location}.`,
          category: tmpl.category,
          location: tmpl.location,
          duration: tmpl.duration,
          price: tmpl.price + a * 50,
          imageUrl: image,
          gallery,
          included: ['Rehber', 'Malzeme'],
          notIncluded: ['Ulaşım'],
          highlights: ['Yerel deneyim', 'Küçük grup'],
          status: 'PUBLISHED',
          featured: e === 0,
          popularityRate: 70 + e * 5,
          meetingPoint: `${tmpl.location} Merkez`,
          agencyId: agency.id,
          averageRating: 4.1 + e * 0.1,
          reviewCount: e + 1,
        },
      });

      const startDate = addDays(new Date(), 10 + e * 5 + a);
      const endDate = addDays(startDate, 0);
      const activityDate = await prisma.activityDate.create({
        data: {
          experienceId: experience.id,
          startDate,
          endDate,
          price: experience.price,
          availableSeats: 20,
          remainingCapacity: 18,
          isActive: true,
        },
      });

      await prisma.experienceDateAgeRange.createMany({
        data: [
          {
            activityDateId: activityDate.id,
            minAge: 0,
            maxAge: 12,
            pricingType: 'HALF',
            value: 50,
          },
          {
            activityDateId: activityDate.id,
            minAge: 13,
            maxAge: null,
            pricingType: 'PERCENTAGE',
            value: 0,
          },
        ],
      });

      experiences.push({
        id: experience.id,
        slug: experience.slug,
        agencyId: agency.id,
        activityDateId: activityDate.id,
        price: Number(experience.price),
      });
    }
  }

  return { tours, experiences, tags, hotels };
}
