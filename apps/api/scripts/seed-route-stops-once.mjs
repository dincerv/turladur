import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const KAPADOKYA_STOPS = [
  {
    dayNumber: 1,
    order: 0,
    name: 'Uçhisar Kalesi',
    description: 'Panoramik vadi manzarası',
    latitude: 38.6301,
    longitude: 34.8053,
    kind: 'VISIT',
  },
  {
    dayNumber: 1,
    order: 1,
    name: 'Göreme Açık Hava Müzesi',
    description: 'Kayadan oyma kiliseler',
    latitude: 38.6398,
    longitude: 34.8448,
    kind: 'VISIT',
  },
  {
    dayNumber: 1,
    order: 2,
    name: 'Göreme Mağara Otel',
    description: 'Gece konaklama',
    latitude: 38.6431,
    longitude: 34.8289,
    kind: 'LODGING',
  },
  {
    dayNumber: 2,
    order: 3,
    name: 'Avanos',
    description: 'Kızılırmak ve çömlek',
    latitude: 38.715,
    longitude: 34.8467,
    kind: 'VISIT',
  },
  {
    dayNumber: 2,
    order: 4,
    name: 'Ürgüp',
    description: 'Tarihi evler',
    latitude: 38.6316,
    longitude: 34.911,
    kind: 'VISIT',
  },
];

const KARADENIZ_STOPS = [
  {
    dayNumber: 1,
    order: 0,
    name: 'Sümela Manastırı',
    description: 'Maçka vadisi — kaya manastırı',
    latitude: 40.6897,
    longitude: 39.6583,
    kind: 'VISIT',
  },
  {
    dayNumber: 1,
    order: 1,
    name: 'Uzungöl',
    description: 'Göl kenarı yürüyüş ve çay molası',
    latitude: 40.6193,
    longitude: 40.2947,
    kind: 'VISIT',
  },
  {
    dayNumber: 1,
    order: 2,
    name: 'Uzungöl Dağ Evi',
    description: 'Gece konaklama',
    latitude: 40.621,
    longitude: 40.292,
    kind: 'LODGING',
  },
  {
    dayNumber: 2,
    order: 3,
    name: 'Ayder Yaylası',
    description: 'Çamlıhemşin — yayla manzarası',
    latitude: 40.953,
    longitude: 41.124,
    kind: 'VISIT',
  },
  {
    dayNumber: 2,
    order: 4,
    name: 'Zilkale',
    description: 'Fırtına vadisi kalesi',
    latitude: 40.912,
    longitude: 40.958,
    kind: 'VISIT',
  },
  {
    dayNumber: 2,
    order: 5,
    name: 'Ayder Termal Otel',
    description: 'Yayla konaklaması',
    latitude: 40.955,
    longitude: 41.13,
    kind: 'LODGING',
  },
  {
    dayNumber: 3,
    order: 6,
    name: 'Pokut Yaylası',
    description: 'Bulut denizinin üstünde seyir noktası',
    latitude: 40.88,
    longitude: 40.72,
    kind: 'VISIT',
  },
  {
    dayNumber: 3,
    order: 7,
    name: 'Çamlıhemşin Merkez',
    description: 'Yöresel lezzet ve serbest zaman',
    latitude: 41.0,
    longitude: 41.0,
    kind: 'VISIT',
  },
];

async function seedByTitle(contains, stops) {
  const tours = await prisma.tour.findMany({
    where: { deletedAt: null, title: { contains, mode: 'insensitive' } },
    select: { id: true, slug: true, title: true, status: true },
    take: 40,
  });
  console.log(`${contains} tours`, tours.length);
  for (const tour of tours) {
    const count = await prisma.tourRouteStop.count({
      where: { tourId: tour.id, deletedAt: null },
    });
    if (count > 0) {
      console.log('skip', tour.slug || tour.title, count);
      continue;
    }
    await prisma.tourRouteStop.createMany({
      data: stops.map((s) => ({ ...s, tourId: tour.id })),
    });
    console.log('seeded', tour.slug || tour.title);
  }
}

async function main() {
  await seedByTitle('Kapadokya', KAPADOKYA_STOPS);
  await seedByTitle('Karadeniz', KARADENIZ_STOPS);
  await seedByTitle('Yayla', KARADENIZ_STOPS);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
