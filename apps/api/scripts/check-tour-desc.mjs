import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

async function main() {
  const t = await prisma.tour.findFirst({
    where: { slug: 'seed-tour-a5-t5-trabzon' },
    select: { id: true, description: true, extras: true },
  });
  console.log('dbDescLen', t?.description?.length ?? 0);
  console.log('dbDesc', t?.description?.slice(0, 160));
  const extras = t?.extras && typeof t.extras === 'object' ? t.extras : {};
  console.log(
    'incl',
    Array.isArray(extras.inclusions) ? extras.inclusions.length : 0,
  );
  console.log(
    'itin',
    extras.itinerary && typeof extras.itinerary === 'object'
      ? Object.keys(extras.itinerary)
      : [],
  );

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6380';
  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const keys = await redis.keys('catalog:tour:*trabzon*');
    const keys2 = await redis.keys(`catalog:tour:${t?.id ?? ''}`);
    console.log('redisKeys', [...keys, ...keys2]);
    for (const k of [...keys, ...keys2]) {
      await redis.del(k);
      console.log('deleted', k);
    }
    // broader clear for this tour
    if (t?.id) {
      await redis.del(`catalog:tour:${t.id}`);
      await redis.del('catalog:tour:seed-tour-a5-t5-trabzon');
    }
    const all = await redis.keys('catalog:tour:*');
    for (const k of all) {
      if (k.includes('trabzon') || k.includes(t?.id ?? '___')) {
        await redis.del(k);
        console.log('deleted2', k);
      }
    }
    await redis.quit();
  } catch (err) {
    console.log('redisErr', String(err));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
