/**
 * One-shot: E2E/test turlarını vitrinden çıkar; aktivite başlık/açıklamalarını zenginleştir.
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const TEST_TITLE_RE =
  /\b(e2e|rota\s*harita|gorsel\s*test|görsel\s*test|local\s*\d{8,})\b/i;
const TEST_SLUG_RE = /(e2e|rota-harita|gorsel-test|görsel-test|local-\d{8,})/i;

const EXPERIENCE_COPY = {
  'Çömlek Atölyesi': [
    'Avanos’un kırmızı kiliyle kısa bir atölye: tornada şekil verme ve hediyelik küçük parça.',
    'Geleneksel çömlek çarkında rehberli deneme; aileler ve ilk kez deneyenler için ideal tempo.',
    'Yerel ustadan kısa brifing sonrası kendi tasarımınızı şekillendirin — fotoğraf molası dahil.',
    'Kapadokya’nın simgesi çömlek sanatına pratik giriş; küçük grup, samimi atölye ortamı.',
    'Ellerinizle şekil verin, ustadan ipuçları alın; bitişte eserinizi paketleyip yanınıza alın.',
  ],
  'Tekne Turu': [
    'Günün en ferah koylarına kısa tekne kaçışı; yüzme, güneşlenme ve hafif ikram molası.',
    'Kekova hattına yakın sakin koylarda yüzün; küçük tekne, kalabalıktan uzak ritim.',
    'Mavi yolculuk: liman kalkışı, 2–3 yüzme durağı ve dönüşte gün batımına yakın varış.',
    'Deniz tutkunları için yarım günlük Kaş tekne turu — maske/şnorkel için serbest zaman.',
    'Turkuaz koylar, serin su ve güvertede çay; aile ve çiftler için dengeli tempo.',
  ],
  'Şarap Tadımı': [
    'Ege bağında rehberli tadım: 4–5 çeşit, lezzet eşleşmeleri ve kısa bağ yürüyüşü.',
    'Urla’nın butik üreticisinde şarap hikâyesi dinleyin; alkolsüz alternatif mevcuttur.',
    'Gün batımına yakın bağ terasında tadım — küçük grup, samimi sohbet temposu.',
    'Yerel üzümlerden seçki tadım + zeytinyağı dokunuşu; gastronomi severlere özel.',
    'Bağ bozumu ruhunu hissedin: kadeh, tabak ve manzara — ulaşım programda belirtilir.',
  ],
  'Yamaç Paraşütü': [
    'Adrenalin dolu tandem uçuş: zirve transferi, brifing ve Ölüdeniz üzerinde süzülme.',
    'İlk kez uçacaklar için sakin tempo; foto/video opsiyonu uçuş öncesi netleştirilir.',
    'Fethiye’nin ikonik manzarasında güvenli tandem deneyimi — hava durumuna bağlı.',
    'Kısa brifing, uzun hatıra: lagün, koylar ve dağ silüeti tek uçuşta.',
    'Macera sevenlere: profesyonel pilotla tandem, iniş plajında karşılama.',
  ],
  'Balon İzleme': [
    'Sabahın ilk ışığında Göreme vadisinde balon silüetlerini izleyin — fotoğraf için ideal açı.',
    'Sıcak çay eşliğinde balon geçidi; aileler için rahat seyir noktası ve transfer.',
    'Kapadokya’nın en bilinen sabah ritüeli: renkli balonlar, vadi ve sessiz izleme alanı.',
    'Uçuşa binmeden manzarayı yakalayın; rehber en iyi seyir noktasını ayarlar.',
    'Gün doğumu brifingi + seyir + dönüş; hava kapalıysa alternatif vadi gezisi önerilir.',
  ],
};

function baseExperienceTitle(title) {
  const parts = String(title).split(/\s+[—–-]\s+/);
  if (parts.length >= 2) return parts[0].trim();
  return String(title).trim();
}

async function main() {
  const tours = await prisma.tour.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, slug: true, status: true },
  });

  let archived = 0;
  for (const tour of tours) {
    if (TEST_TITLE_RE.test(tour.title) || TEST_SLUG_RE.test(tour.slug)) {
      await prisma.tour.update({
        where: { id: tour.id },
        data: {
          deletedAt: new Date(),
          status: 'ARCHIVED',
          featured: false,
        },
      });
      archived += 1;
      console.log(`archived tour ${tour.slug}`);
    }
  }

  const experiences = await prisma.experience.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, description: true, agencyId: true },
    orderBy: { createdAt: 'asc' },
  });

  const counters = {};
  let expUpdated = 0;
  for (const exp of experiences) {
    const base = baseExperienceTitle(exp.title);
    const variants = EXPERIENCE_COPY[base];
    if (!variants) continue;
    const idx = counters[base] ?? 0;
    counters[base] = idx + 1;
    const description = variants[idx % variants.length];
    const needsTitle = exp.title !== base;
    const needsDesc =
      !exp.description ||
      /kısa açıklama/i.test(exp.description) ||
      exp.description.length < 40;
    if (!needsTitle && !needsDesc) continue;
    await prisma.experience.update({
      where: { id: exp.id },
      data: {
        ...(needsTitle ? { title: base } : {}),
        ...(needsDesc ? { description } : {}),
      },
    });
    expUpdated += 1;
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

  console.log(
    `done. archivedTours=${archived} experiencesUpdated=${expUpdated}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
