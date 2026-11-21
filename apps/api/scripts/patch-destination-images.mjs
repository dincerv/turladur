/**
 * Patch seed constants + live DB tour/experience cover images to destination-fit URLs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const IMG = {
  kapadokya:
    'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
  kapBalloons:
    'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1600&q=80',
  kapPexels:
    'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=1600',
  kapCouple:
    'https://images.pexels.com/photos/3889742/pexels-photo-3889742.jpeg?auto=compress&cs=tinysrgb&w=1600',
  abant:
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
  forestLake:
    'https://images.pexels.com/photos/3889650/pexels-photo-3889650.jpeg?auto=compress&cs=tinysrgb&w=1600',
  forest:
    'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1600',
  amasra:
    'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1600',
  greenHills:
    'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1600',
  historicTown:
    'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
  market:
    'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=1600',
  gap: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
  gapCulture:
    'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1600&q=80',
  tuz: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80',
  likya:
    'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
  beach:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  coast:
    'https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=1600',
  yayla:
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
  mount:
    'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1600',
};

function w(url, size) {
  return url.replace(/([?&])w=\d+/, `$1w=${size}`);
}

const TOUR_COVERS = [
  {
    match: /Beypazarı/i,
    cover: IMG.historicTown,
    gallery: [IMG.historicTown, IMG.market],
  },
  {
    match: /Abant|Yedigöller/i,
    cover: IMG.abant,
    gallery: [IMG.abant, IMG.forestLake],
  },
  {
    match: /Amasra|Safranbolu/i,
    cover: IMG.amasra,
    gallery: [IMG.amasra, IMG.historicTown],
  },
  {
    match: /Kapadokya/i,
    cover: IMG.kapadokya,
    gallery: [IMG.kapadokya, IMG.kapBalloons, IMG.kapPexels],
  },
  { match: /Tuz Gölü/i, cover: IMG.tuz, gallery: [IMG.tuz, IMG.abant] },
  {
    match: /GAP|Mezopotamya|Mardin/i,
    cover: IMG.gap,
    gallery: [IMG.gap, IMG.gapCulture],
  },
  {
    match: /Karadeniz|Yayla|Trabzon|Uzungöl|Ayder/i,
    cover: IMG.yayla,
    gallery: [IMG.yayla, IMG.greenHills],
  },
  {
    match: /Likya|Ege|Antalya|Kaş|Fethiye/i,
    cover: IMG.likya,
    gallery: [IMG.likya, IMG.beach, IMG.coast],
  },
];

const EXPERIENCE_COVERS = [
  {
    match: /Balon|Kapadokya|Soğanlı/i,
    cover: IMG.kapBalloons,
    gallery: [IMG.kapBalloons, IMG.kapadokya],
  },
  {
    match: /Beypazarı/i,
    cover: IMG.historicTown,
    gallery: [IMG.historicTown, IMG.market],
  },
  { match: /Tuz Gölü/i, cover: IMG.tuz, gallery: [IMG.tuz] },
  { match: /Ilgaz/i, cover: IMG.forest, gallery: [IMG.forest, IMG.greenHills] },
  { match: /Eymir/i, cover: IMG.abant, gallery: [IMG.abant] },
  { match: /Gordion/i, cover: IMG.gap, gallery: [IMG.gap] },
  { match: /Kızılcahamam/i, cover: IMG.forest, gallery: [IMG.forest] },
];

function patchConstants() {
  const path = join(root, 'prisma/seed/constants.ts');
  let s = readFileSync(path, 'utf8');

  const pairs = [
    [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80',
      IMG.historicTown,
    ],
    [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80',
      w(IMG.historicTown, 1200),
    ],
    [
      'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1600&q=80',
      IMG.market,
    ],
    [
      'https://images.unsplash.com/photo-1501785888041-af3bb6bb5015?auto=format&fit=crop&w=1600&q=80',
      IMG.abant,
    ],
    [
      'https://images.unsplash.com/photo-1501785888041-af3bb6bb5015?auto=format&fit=crop&w=1200&q=80',
      w(IMG.abant, 1200),
    ],
    [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
      IMG.forest,
    ],
    [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
      w(IMG.forest, 1200),
    ],
    [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
      IMG.amasra,
    ],
    [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      IMG.greenHills,
    ],
    [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      w(IMG.greenHills, 1200),
    ],
    [
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=80',
      IMG.kapBalloons,
    ],
    [
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1200&q=80',
      w(IMG.kapBalloons, 1200),
    ],
    [
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1600&q=80',
      IMG.kapPexels,
    ],
    [
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80',
      w(IMG.kapPexels, 1200),
    ],
    [
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1600&q=80',
      IMG.gap,
    ],
    [
      'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?auto=format&fit=crop&w=1600&q=80',
      IMG.gapCulture,
    ],
    // Tuz (and leftover misty) — replace all misty mountain used for Tuz with mirror sunset
    [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
      IMG.tuz,
    ],
    [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      w(IMG.tuz, 1200),
    ],
  ];

  for (const [from, to] of pairs) {
    const n = s.split(from).length - 1;
    s = s.split(from).join(to);
    console.log(`constants: ${n}x ${from.slice(32, 55)}…`);
  }

  // Title-scoped cover/gallery fixes after blanket URL swaps
  const tourFixes = [
    [
      'Beypazarı Tarihi Konaklar',
      IMG.historicTown,
      [IMG.historicTown, IMG.market],
    ],
    ['Abant & Yedigöller Doğa', IMG.abant, [IMG.abant, IMG.forestLake]],
    [
      'Amasra & Safranbolu Kaçamağı',
      IMG.amasra,
      [IMG.amasra, IMG.historicTown],
    ],
    [
      'Kapadokya Hafta Sonu',
      IMG.kapadokya,
      [IMG.kapadokya, IMG.kapBalloons, IMG.kapPexels],
    ],
    ['Tuz Gölü Gün Batımı', IMG.tuz, [IMG.tuz, IMG.abant]],
    ['GAP & Mezopotamya Kültür', IMG.gap, [IMG.gap, IMG.gapCulture]],
    ['Doğu Karadeniz Yaylalar', IMG.yayla, [IMG.yayla, IMG.greenHills]],
    ['Likya & Ege Kıyı Kültür', IMG.likya, [IMG.likya, IMG.beach]],
  ];

  for (const [title, cover, gallery] of tourFixes) {
    const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `(title: '${esc}'[\\s\\S]*?coverUrl:\\s*\\n\\s*')[^']+([\\s\\S]*?galleryUrls: \\[)[\\s\\S]*?(\\],)`,
      'm',
    );
    if (!re.test(s)) {
      console.warn('tour block not found:', title);
      continue;
    }
    s = s.replace(
      re,
      `$1${cover}$2\n      ${gallery.map((u) => `'${u}'`).join(',\n      ')}\n    $3`,
    );
  }

  const expFixes = [
    [
      'Kapadokya Gün Doğumu Balon İzleme & Vadiler',
      IMG.kapBalloons,
      [IMG.kapBalloons, IMG.kapadokya],
    ],
    [
      'Beypazarı Tarihi Konaklar & Gastronomi Yürüyüşü',
      IMG.historicTown,
      [IMG.historicTown, IMG.market],
    ],
    ['Tuz Gölü Gün Batımı Fotoğraf Turu', IMG.tuz, [IMG.tuz]],
    ['Ilgaz Doğa Yürüyüşü', IMG.forest, [IMG.forest, IMG.greenHills]],
    ['Eymir Gölü Sabah Koşu & Kahvaltı', IMG.abant, [IMG.abant]],
    ['Gordion Antik Kent Gezisi', IMG.gap, [IMG.gap]],
    ['Kızılcahamam Termal & Orman', IMG.forest, [IMG.forest]],
    ['Soğanlı Vadisi Kısa Keşif', IMG.kapadokya, [IMG.kapadokya]],
  ];

  for (const [title, cover, gallery] of expFixes) {
    const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `(title: '${esc}'[\\s\\S]*?imageUrl:\\s*\\n\\s*')[^']+([\\s\\S]*?gallery: \\[)[\\s\\S]*?(\\],)`,
      'm',
    );
    if (!re.test(s)) {
      console.warn('experience block not found:', title);
      continue;
    }
    s = s.replace(
      re,
      `$1${w(cover, 1200)}$2\n      ${gallery.map((u) => `'${w(u, 1200)}'`).join(',\n      ')}\n    $3`,
    );
  }

  s = s.replace(
    /export const COVER_IMAGES = \[[\s\S]*?\] as const;/,
    `export const COVER_IMAGES = [
  '${IMG.kapadokya}',
  '${IMG.amasra}',
  '${IMG.abant}',
  '${IMG.gap}',
  '${IMG.likya}',
] as const;`,
  );

  writeFileSync(path, s);
  console.log('constants.ts patched');
}

async function patchDb() {
  const prisma = new PrismaClient();
  let toursUpdated = 0;
  let expUpdated = 0;

  try {
    const tours = await prisma.tour.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      select: { id: true, title: true, coverUrl: true, galleryUrls: true },
    });

    for (const tour of tours) {
      const rule = TOUR_COVERS.find((r) => r.match.test(tour.title));
      if (!rule) continue;
      await prisma.tour.update({
        where: { id: tour.id },
        data: {
          coverUrl: rule.cover,
          galleryUrls: rule.gallery,
        },
      });
      toursUpdated += 1;
    }

    const experiences = await prisma.experience.findMany({
      select: { id: true, title: true, imageUrl: true, gallery: true },
    });

    for (const exp of experiences) {
      const rule = EXPERIENCE_COVERS.find((r) => r.match.test(exp.title));
      if (!rule) continue;
      await prisma.experience.update({
        where: { id: exp.id },
        data: {
          imageUrl: w(rule.cover, 1200),
          gallery: rule.gallery.map((u) => w(u, 1200)),
        },
      });
      expUpdated += 1;
    }

    console.log(
      `DB tours updated: ${toursUpdated}, experiences: ${expUpdated}`,
    );
  } finally {
    await prisma.$disconnect();
  }

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const keys = await redis.keys('*catalog*');
    const keys2 = await redis.keys('*route*');
    const keys3 = await redis.keys('*tour*');
    const all = [...new Set([...keys, ...keys2, ...keys3])];
    if (all.length) {
      await redis.del(...all);
      console.log(`Redis flushed ${all.length} keys`);
    } else {
      console.log('Redis: no matching cache keys');
    }
    redis.disconnect();
  } catch (e) {
    console.warn('Redis flush skipped:', e.message);
  }
}

const mode = process.argv[2] || 'all';
if (mode === 'constants' || mode === 'all') patchConstants();
if (mode === 'db' || mode === 'all') await patchDb();
