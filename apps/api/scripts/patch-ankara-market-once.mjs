/**
 * One-shot: Ankara çıkışlı faz-1 vitrin — acente adları, turlar, deneyimler.
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const AGENCIES = [
  { id: 'seed-agency-01', name: 'Başkent Turizm' },
  { id: 'seed-agency-02', name: 'Anadolu Rotaları' },
  { id: 'seed-agency-03', name: 'Angora Gezi' },
  { id: 'seed-agency-04', name: 'Hitit Seyahat' },
  { id: 'seed-agency-05', name: 'Kızılay Tur' },
];

const TOURS = [
  {
    title: 'Beypazarı Tarihi Konaklar',
    city: 'Beypazarı',
    category: 'CULTURAL',
    days: 1,
    price: 1290,
    coverUrl:
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
    description:
      'Ankara’dan günübirlik Beypazarı: tarihi konaklar, çarşı sokakları ve yerel lezzet molası.',
  },
  {
    title: 'Abant & Yedigöller Doğa',
    city: 'Bolu',
    category: 'NATURE',
    days: 1,
    price: 1590,
    coverUrl:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
    description: 'Ankara’dan günübirlik Abant Gölü ve Yedigöller doğa rotası.',
  },
  {
    title: 'Amasra & Safranbolu Kaçamağı',
    city: 'Bartın',
    category: 'CULTURAL',
    days: 2,
    price: 2890,
    coverUrl:
      'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1600',
    description:
      'Ankara çıkışlı 1 gecelik Batı Karadeniz: Safranbolu konakları ve Amasra kalesi.',
  },
  {
    title: 'Kapadokya Hafta Sonu',
    city: 'Nevşehir',
    category: 'CULTURAL',
    days: 2,
    price: 3490,
    coverUrl:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
    description:
      'Ankara’dan ~3 saat mesafede Kapadokya hafta sonu: peri bacaları ve Göreme vadisi.',
  },
  {
    title: 'Tuz Gölü Gün Batımı',
    city: 'Şereflikoçhisar',
    category: 'NATURE',
    days: 1,
    price: 1190,
    coverUrl:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80',
    description:
      'Ankara’dan günübirlik Tuz Gölü fotoğraf turu: gün batımı ayna efekti.',
  },
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
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
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
    title: 'Kapadokya Gün Doğumu Balon İzleme & Vadiler',
    location: 'Göreme',
    category: 'Doğa',
    duration: '4 saat',
    price: 1890,
    imageUrl:
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80',
    description:
      'Gün doğumunda peri bacaları üzerinde balon geçidini izleyin; vadi seyir noktası.',
  },
  {
    title: 'Beypazarı Tarihi Konaklar & Gastronomi Yürüyüşü',
    location: 'Beypazarı',
    category: 'Gastronomi',
    duration: '5 saat',
    price: 990,
    imageUrl:
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1200',
    description:
      'Beypazarı’nda konak sokakları ve yerel tatlar eşliğinde gastronomi yürüyüşü.',
  },
  {
    title: 'Tuz Gölü Gün Batımı Fotoğraf Turu',
    location: 'Şereflikoçhisar',
    category: 'Doğa',
    duration: '4 saat',
    price: 850,
    imageUrl:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    description:
      'Tuz Gölü’nde gün batımı ayna efekti için rehberli fotoğraf turu.',
  },
  {
    title: 'Ilgaz Doğa Yürüyüşü',
    location: 'Kastamonu',
    category: 'Macera',
    duration: '6 saat',
    price: 1250,
    imageUrl:
      'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1200',
    description:
      'Ilgaz ormanlarında rehberli doğa yürüyüşü; Ankara çıkışlı günübirlik kaçış.',
  },
  {
    title: 'Eymir Gölü Sabah Koşu & Kahvaltı',
    location: 'Ankara',
    category: 'Doğa',
    duration: '3 saat',
    price: 690,
    imageUrl:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
    description:
      'Eymir Gölü çevresinde hafif tempo yürüyüş ve göl kenarı kahvaltı.',
  },
  {
    title: 'Gordion Antik Kent Gezisi',
    location: 'Polatlı',
    category: 'Kültür',
    duration: '4 saat',
    price: 780,
    imageUrl:
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80',
    description: 'Polatlı Gordion’da Frig izleri ve rehberli kültür gezisi.',
  },
  {
    title: 'Kızılcahamam Termal & Orman',
    location: 'Kızılcahamam',
    category: 'Doğa',
    duration: '5 saat',
    price: 1100,
    imageUrl:
      'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1200',
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
    description:
      'Kapadokya Soğanlı Vadisi’nde sakin tempo keşif ve fotoğraf molası.',
  },
];

async function flushCatalogCache() {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  try {
    const redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const keys = await redis.keys('*catalog*');
    if (keys.length) await redis.del(...keys);
    console.log(`flushed ${keys.length} catalog keys`);
    await redis.quit();
  } catch (err) {
    console.warn('redis flush skipped:', err?.message || err);
  }
}

async function main() {
  for (const agency of AGENCIES) {
    await prisma.agency.updateMany({
      where: { id: agency.id },
      data: {
        companyName: agency.name,
        legalTitle: `${agency.name} A.Ş.`,
        city: 'Ankara',
        tursabUnvan: `${agency.name} A.Ş.`,
        tursabCity: 'Ankara',
        address: `Atatürk Cad. ${agency.name}, Ankara`,
      },
    });
    console.log('agency →', agency.name);
  }

  const agencies = await prisma.agency.findMany({
    where: { id: { in: AGENCIES.map((a) => a.id) } },
    orderBy: { id: 'asc' },
  });

  for (let a = 0; a < agencies.length; a++) {
    const agency = agencies[a];
    const tours = await prisma.tour.findMany({
      where: {
        agencyId: agency.id,
        deletedAt: null,
        slug: { startsWith: `seed-tour-a${a + 1}-` },
      },
      orderBy: { slug: 'asc' },
    });

    for (let t = 0; t < Math.min(tours.length, TOURS.length); t++) {
      const tmpl = TOURS[t];
      const tour = tours[t];
      await prisma.tour.update({
        where: { id: tour.id },
        data: {
          title: `${tmpl.title} — ${agency.companyName}`,
          description: tmpl.description,
          coverUrl: tmpl.coverUrl,
          galleryUrls: [tmpl.coverUrl],
          price: tmpl.price + a * 100,
          category: tmpl.category,
          durationDays: tmpl.days,
          stayKind: tmpl.days === 1 ? 'DAY_TRIP' : 'OVERNIGHT',
          departureCities: ['Ankara'],
          status: 'PUBLISHED',
          featured: t === 0,
          extras: {
            ...(typeof tour.extras === 'object' &&
            tour.extras &&
            !Array.isArray(tour.extras)
              ? tour.extras
              : {}),
            departureCity: ['Ankara'],
            originCity: 'Ankara',
            destinations: [{ city: tmpl.city, description: '' }],
            region: tmpl.city,
            tourType: tmpl.days === 1 ? 'Günübirlik Tur' : 'Kültür Turu',
          },
        },
      });
      console.log('tour ←', tmpl.title, '→', agency.companyName);
    }

    // Fazla / uyumsuz seed turlarını arşivle (vitrinden düşsün)
    if (tours.length > TOURS.length) {
      const extra = tours.slice(TOURS.length);
      for (const tour of extra) {
        await prisma.tour.update({
          where: { id: tour.id },
          data: { status: 'ARCHIVED' },
        });
      }
    }

    const experiences = await prisma.experience.findMany({
      where: {
        agencyId: agency.id,
        slug: { startsWith: `seed-exp-a${a + 1}-` },
      },
      orderBy: { slug: 'asc' },
    });

    for (let e = 0; e < Math.min(experiences.length, EXPERIENCES.length); e++) {
      const tmpl = EXPERIENCES[e];
      const exp = experiences[e];
      await prisma.experience.update({
        where: { id: exp.id },
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
          featured: e === 0,
          meetingPoint: `${tmpl.location} Merkez`,
        },
      });
      console.log('experience ←', tmpl.title, '→', agency.companyName);
    }
  }

  // Eski uzak aktivite / yanlış destinasyon başlıklarını arşivle
  await prisma.tour.updateMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: 'Bodrum Marina' } },
        { title: { contains: 'Pamukkale Travertenleri' } },
        { title: { contains: 'Fethiye Ölüdeniz Escape' } },
      ],
      NOT: { departureCities: { has: 'Ankara' } },
    },
    data: { status: 'ARCHIVED' },
  });

  await prisma.experience.updateMany({
    where: {
      OR: [
        { title: { contains: 'Sümela' } },
        { title: { contains: 'Efes Antik' } },
        { title: { contains: 'Boğaz Gün Batımı' } },
        { title: { contains: 'Yamaç Paraşütü' } },
        { title: { contains: 'Tekne Turu' } },
        { title: { contains: 'Şarap Tadımı' } },
      ],
    },
    data: { status: 'ARCHIVED' },
  });

  await flushCatalogCache();
  console.log('done. ankara market patch applied');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
