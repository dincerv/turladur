/**
 * One-shot: vitrin için eksik benzersiz tur/aktivite kayıtlarını tamamla (8’er).
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const NEW_TOURS = [
  {
    title: 'Pamukkale Travertenleri',
    city: 'Denizli',
    category: 'CULTURAL',
    days: 2,
    price: 3990,
    coverUrl:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80',
    description:
      'Pamukkale’nin beyaz travertenleri ve Hierapolis antik kentiyle iki günlük kültür kaçamakı.',
  },
  {
    title: 'Fethiye Ölüdeniz Escape',
    city: 'Muğla',
    category: 'NATURE',
    days: 3,
    price: 5590,
    coverUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    description:
      'Ölüdeniz lagünü, koy turu ve doğa odaklı üç günlük Fethiye kaçamakı.',
  },
  {
    title: 'Bodrum Marina & Lezzet',
    city: 'Muğla',
    category: 'GASTRONOMY',
    days: 2,
    price: 4690,
    coverUrl:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
    description:
      'Bodrum marina ve Ege lezzetleriyle iki günlük gastronomi kaçamakı.',
  },
];

const NEW_EXPERIENCES = [
  {
    title: 'Sümela Manastırı Turu',
    location: 'Trabzon',
    category: 'Kültür',
    duration: '5 saat',
    price: 1650,
    description:
      'Sümela Manastırı’na rehberli yarım günlük kültür gezisi; vadi manzarası ve tarih anlatımı.',
    imageUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    agencyIndex: 4,
  },
  {
    title: 'Boğaz Gün Batımı Teknesi',
    location: 'İstanbul',
    category: 'Deniz',
    duration: '2.5 saat',
    price: 1890,
    description:
      'İstanbul Boğazı’nda gün batımı tekne turu; silüet, çay ikramı ve fotoğraf molaları.',
    imageUrl:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
    agencyIndex: 1,
  },
  {
    title: 'Efes Antik Kent Gezisi',
    location: 'Selçuk',
    category: 'Kültür',
    duration: '4 saat',
    price: 1750,
    description:
      'Efes Antik Kenti’nde rehberli kültür turu; Celsus, büyük tiyatro ve Agora hattı.',
    imageUrl:
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80',
    agencyIndex: 3,
  },
];

function hasTitle(rows, title) {
  const key = title.toLocaleLowerCase('tr-TR');
  return rows.some((row) => {
    const base = String(row.title)
      .split(/\s+[—–-]\s+/)[0]
      .trim();
    return base.toLocaleLowerCase('tr-TR') === key;
  });
}

async function main() {
  const agencies = await prisma.agency.findMany({
    where: { deletedAt: null, companyName: { contains: 'Demo Acente' } },
    orderBy: { companyName: 'asc' },
    take: 5,
  });
  if (agencies.length === 0) {
    throw new Error('Demo acente bulunamadı');
  }

  const tours = await prisma.tour.findMany({
    where: { deletedAt: null },
    select: { title: true },
  });
  let toursAdded = 0;
  for (let i = 0; i < NEW_TOURS.length; i++) {
    const tmpl = NEW_TOURS[i];
    if (hasTitle(tours, tmpl.title)) continue;
    const agency = agencies[i % agencies.length];
    const slug = `seed-tour-extra-${tmpl.city.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${i + 1}`;
    await prisma.tour.create({
      data: {
        title: `${tmpl.title} — ${agency.companyName}`,
        slug,
        description: tmpl.description,
        coverUrl: tmpl.coverUrl,
        galleryUrls: [tmpl.coverUrl],
        price: tmpl.price,
        category: tmpl.category,
        status: 'PUBLISHED',
        durationDays: tmpl.days,
        stayKind: tmpl.days === 1 ? 'DAY_TRIP' : 'OVERNIGHT',
        destinationScope: 'DOMESTIC',
        departureCities: [tmpl.city],
        featured: true,
        averageRating: 4.4,
        reviewCount: 3,
        agencyId: agency.id,
        extras: {
          region: tmpl.city,
          departureCity: [tmpl.city],
          destinations: [{ city: tmpl.city, description: '' }],
          cancellationPolicy: 'Kalkıştan 7 gün önce ücretsiz iptal',
        },
      },
    });
    toursAdded += 1;
    console.log(`tour + ${tmpl.title} → ${agency.companyName}`);
  }

  const experiences = await prisma.experience.findMany({
    where: { deletedAt: null },
    select: { title: true },
  });
  let expAdded = 0;
  for (const tmpl of NEW_EXPERIENCES) {
    if (hasTitle(experiences, tmpl.title)) continue;
    const agency = agencies[tmpl.agencyIndex % agencies.length];
    const slug = `seed-exp-extra-${tmpl.location
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')}-${tmpl.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .slice(0, 24)}`;
    await prisma.experience.create({
      data: {
        title: tmpl.title,
        slug,
        description: tmpl.description,
        longDescription: tmpl.description,
        category: tmpl.category,
        location: tmpl.location,
        duration: tmpl.duration,
        price: tmpl.price,
        imageUrl: tmpl.imageUrl,
        gallery: [tmpl.imageUrl],
        included: ['Rehber'],
        notIncluded: ['Ulaşım'],
        highlights: ['Yerel deneyim'],
        status: 'PUBLISHED',
        featured: true,
        popularityRate: 82,
        meetingPoint: `${tmpl.location} Merkez`,
        agencyId: agency.id,
        averageRating: 4.5,
        reviewCount: 4,
      },
    });
    expAdded += 1;
    console.log(`experience + ${tmpl.title} → ${agency.companyName}`);
  }

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6380';
  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const keys = [
      ...(await redis.keys('catalog:tour:*')),
      ...(await redis.keys('catalog:experiences:*')),
    ];
    if (keys.length) await redis.del(...keys);
    console.log(`flushed ${keys.length} catalog keys`);
    await redis.quit();
  } catch (err) {
    console.warn('redis flush skipped:', err?.message || err);
  }

  console.log(`done. toursAdded=${toursAdded} experiencesAdded=${expAdded}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
