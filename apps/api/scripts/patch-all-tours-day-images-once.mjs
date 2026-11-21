/**
 * One-shot: tüm seed tur şablonlarına gün bazlı galeri fotoğrafı eşle + Redis flush.
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

/** title → dayKey → imageUrls */
const DAY_IMAGES = {
  'Kapadokya Peri Bacaları': {
    day0: [
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
    ],
    day1: [
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
    ],
    day2: [
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'Antalya Likya Yolu': {
    day0: [
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    ],
    day1: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'İstanbul Boğaz & Tarih': {
    day0: [
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'Ege Gastronomi Rotası': {
    day0: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
    ],
    day1: [
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
    ],
    day2: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  'Karadeniz Yayla Escape': {
    day0: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    ],
    day1: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    ],
    day2: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    ],
    day4: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    ],
  },
};

async function main() {
  const tours = await prisma.tour.findMany({
    select: { id: true, title: true, extras: true, slug: true },
  });

  function resolveMapping(title) {
    if (DAY_IMAGES[title]) return DAY_IMAGES[title];
    for (const [key, value] of Object.entries(DAY_IMAGES)) {
      if (
        title === key ||
        title.startsWith(`${key} —`) ||
        title.startsWith(key)
      ) {
        return value;
      }
    }
    return null;
  }

  let updated = 0;
  for (const tour of tours) {
    const mapping = resolveMapping(tour.title);
    if (!mapping) continue;

    const extras =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? { ...tour.extras }
        : {};
    const itinerary =
      extras.itinerary && typeof extras.itinerary === 'object'
        ? { ...extras.itinerary }
        : {};

    for (const [dayKey, urls] of Object.entries(mapping)) {
      const day = itinerary[dayKey];
      if (!day || typeof day !== 'object') {
        itinerary[dayKey] = {
          title: dayKey,
          description: '',
          imageUrls: urls,
          images: urls,
        };
        continue;
      }
      itinerary[dayKey] = {
        ...day,
        imageUrls: urls,
        images: urls,
      };
    }

    extras.itinerary = itinerary;
    await prisma.tour.update({
      where: { id: tour.id },
      data: { extras },
    });
    updated += 1;
    console.log(`updated ${tour.slug} (${tour.title})`);
  }

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6380';
  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const keys = await redis.keys('catalog:tour:*');
    if (keys.length) await redis.del(...keys);
    console.log(`flushed ${keys.length} catalog:tour:* keys`);
    await redis.quit();
  } catch (err) {
    console.warn('redis flush skipped:', err?.message || err);
  }

  console.log(`done. updated=${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
