import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const day0imgs = [
  'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
];
const day1imgs = [
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80',
];

async function main() {
  const tours = await prisma.tour.findMany({
    where: {
      deletedAt: null,
      title: { startsWith: 'Antalya Likya Yolu' },
    },
    select: { id: true, slug: true, extras: true },
  });

  let updated = 0;
  for (const tour of tours) {
    const extras =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? { ...tour.extras }
        : {};
    const itin =
      extras.itinerary && typeof extras.itinerary === 'object'
        ? { ...extras.itinerary }
        : {};
    const d0 =
      itin.day0 && typeof itin.day0 === 'object'
        ? { ...itin.day0 }
        : { title: '1. Gün', description: '' };
    const d1 =
      itin.day1 && typeof itin.day1 === 'object'
        ? { ...itin.day1 }
        : { title: '2. Gün', description: '' };
    d0.imageUrls = day0imgs;
    d0.images = day0imgs;
    d1.imageUrls = day1imgs;
    d1.images = day1imgs;
    itin.day0 = d0;
    itin.day1 = d1;
    extras.itinerary = itin;
    await prisma.tour.update({
      where: { id: tour.id },
      data: { extras },
    });
    updated += 1;
  }

  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
    const keys = await redis.keys('catalog:tour:*');
    if (keys.length) await redis.del(...keys);
    await redis.quit();
  } catch {
    // optional
  }

  console.log(JSON.stringify({ updated }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
