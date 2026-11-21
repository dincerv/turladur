/**
 * Create missing Ankara-market tours/experiences (indexes 6–8) per seed agency.
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const TOURS = [
  {
    title: 'GAP & Mezopotamya Kültür',
    city: 'Mardin',
    category: 'CULTURAL',
    days: 5,
    price: 14500,
    coverUrl:
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
    description:
      'Ankara çıkışlı GAP kültürü: Mardin, Göbeklitepe, Şanlıurfa ve Halfeti.',
  },
  {
    title: 'Doğu Karadeniz Yaylalar',
    city: 'Trabzon',
    category: 'NATURE',
    days: 5,
    price: 15500,
    coverUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    description: 'Ankara çıkışlı Doğu Karadeniz yayla turu: Uzungöl ve Ayder.',
  },
  {
    title: 'Likya & Ege Kıyı Kültür',
    city: 'Antalya',
    category: 'NATURE',
    days: 6,
    price: 16800,
    coverUrl:
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
    description:
      'Ankara çıkışlı Likya & Ege kıyı kültürü: Antalya–Kaş–Fethiye hattı.',
  },
];

const EXPERIENCES = [
  {
    title: 'Gordion Antik Kent Gezisi',
    location: 'Polatlı',
    category: 'Kültür',
    duration: '4 saat',
    price: 780,
    imageUrl:
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80',
    description: 'Polatlı Gordion’da Frig izleri ve rehberli kültür gezisi.',
  },
  {
    title: 'Kızılcahamam Termal & Orman',
    location: 'Kızılcahamam',
    category: 'Doğa',
    duration: '5 saat',
    price: 1100,
    imageUrl:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    description: 'Kızılcahamam’da orman havası ve termal bölge tanıtımı.',
  },
  {
    title: 'Soğanlı Vadisi Kısa Keşif',
    location: 'Kapadokya',
    category: 'Kültür',
    duration: '3 saat',
    price: 950,
    imageUrl:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1200&q=80',
    description: 'Kapadokya Soğanlı Vadisi’nde sakin tempo keşif.',
  },
];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const agencies = await prisma.agency.findMany({
    where: {
      id: {
        in: [
          'seed-agency-01',
          'seed-agency-02',
          'seed-agency-03',
          'seed-agency-04',
          'seed-agency-05',
        ],
      },
    },
    orderBy: { id: 'asc' },
  });

  for (let a = 0; a < agencies.length; a++) {
    const agency = agencies[a];
    const aNum = a + 1;

    for (let i = 0; i < TOURS.length; i++) {
      const tmpl = TOURS[i];
      const slot = 6 + i;
      const slug = `seed-tour-a${aNum}-t${slot}-${tmpl.city
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')}`;
      const existing = await prisma.tour.findFirst({
        where: {
          agencyId: agency.id,
          OR: [{ slug }, { title: { startsWith: `${tmpl.title} —` } }],
        },
      });
      if (existing) {
        await prisma.tour.update({
          where: { id: existing.id },
          data: {
            title: `${tmpl.title} — ${agency.companyName}`,
            description: tmpl.description,
            coverUrl: tmpl.coverUrl,
            galleryUrls: [tmpl.coverUrl],
            price: tmpl.price + a * 100,
            category: tmpl.category,
            durationDays: tmpl.days,
            stayKind: 'OVERNIGHT',
            departureCities: ['Ankara'],
            status: 'PUBLISHED',
            deletedAt: null,
            extras: {
              departureCity: ['Ankara'],
              originCity: 'Ankara',
              destinations: [{ city: tmpl.city, description: '' }],
              region: tmpl.city,
              tourType: 'Kültür Turu',
            },
          },
        });
        console.log('tour upsert', tmpl.title, agency.companyName);
        continue;
      }

      const tour = await prisma.tour.create({
        data: {
          title: `${tmpl.title} — ${agency.companyName}`,
          slug,
          description: tmpl.description,
          coverUrl: tmpl.coverUrl,
          galleryUrls: [tmpl.coverUrl],
          price: tmpl.price + a * 100,
          category: tmpl.category,
          status: 'PUBLISHED',
          durationDays: tmpl.days,
          stayKind: 'OVERNIGHT',
          destinationScope: 'DOMESTIC',
          departureCities: ['Ankara'],
          extras: {
            departureCity: ['Ankara'],
            originCity: 'Ankara',
            destinations: [{ city: tmpl.city, description: '' }],
            region: tmpl.city,
            tourType: 'Kültür Turu',
            transportation: 'Otobüs',
            maxParticipants: 24,
          },
          childMaxAge: 12,
          minParticipants: 2,
          featured: false,
          averageRating: 4.3,
          reviewCount: 2,
          agencyId: agency.id,
        },
      });

      const start = addDays(new Date(), 20 + slot * 3 + a);
      await prisma.tourDate.create({
        data: {
          tourId: tour.id,
          startDate: start,
          endDate: addDays(start, tmpl.days - 1),
          capacity: 24,
          remainingCapacity: 20,
          isActive: true,
        },
      });
      console.log('tour create', tmpl.title, agency.companyName);
    }

    for (let i = 0; i < EXPERIENCES.length; i++) {
      const tmpl = EXPERIENCES[i];
      const slot = 6 + i;
      const slug = `seed-exp-a${aNum}-e${slot}`;
      const existing = await prisma.experience.findFirst({
        where: {
          agencyId: agency.id,
          OR: [{ slug }, { title: tmpl.title }],
        },
      });
      if (existing) {
        await prisma.experience.update({
          where: { id: existing.id },
          data: {
            title: tmpl.title,
            description: tmpl.description,
            longDescription: `${tmpl.title} — ${tmpl.location}. ${tmpl.description}`,
            category: tmpl.category,
            location: tmpl.location,
            duration: tmpl.duration,
            price: tmpl.price + a * 50,
            imageUrl: tmpl.imageUrl,
            gallery: [tmpl.imageUrl],
            status: 'PUBLISHED',
            meetingPoint: `${tmpl.location} Merkez`,
          },
        });
        console.log('exp upsert', tmpl.title, agency.companyName);
        continue;
      }

      const experience = await prisma.experience.create({
        data: {
          title: tmpl.title,
          slug,
          description: tmpl.description,
          longDescription: `${tmpl.title} — ${tmpl.location}. ${tmpl.description}`,
          category: tmpl.category,
          location: tmpl.location,
          duration: tmpl.duration,
          price: tmpl.price + a * 50,
          imageUrl: tmpl.imageUrl,
          gallery: [tmpl.imageUrl],
          included: ['Rehber'],
          notIncluded: ['Ulaşım'],
          highlights: ['Yerel deneyim'],
          status: 'PUBLISHED',
          featured: false,
          popularityRate: 75,
          meetingPoint: `${tmpl.location} Merkez`,
          agencyId: agency.id,
          averageRating: 4.2,
          reviewCount: 1,
        },
      });
      const startDate = addDays(new Date(), 12 + slot + a);
      await prisma.activityDate.create({
        data: {
          experienceId: experience.id,
          startDate,
          endDate: startDate,
          price: experience.price,
          availableSeats: 20,
          remainingCapacity: 18,
          isActive: true,
        },
      });
      console.log('exp create', tmpl.title, agency.companyName);
    }
  }

  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const keys = await redis.keys('*catalog*');
    if (keys.length) await redis.del(...keys);
    console.log('flushed', keys.length, 'keys');
    await redis.quit();
  } catch {
    console.warn('redis flush skipped');
  }

  console.log('fill done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
