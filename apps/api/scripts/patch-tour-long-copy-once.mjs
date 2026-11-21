/**
 * Mevcut seed turlara uzun Tur Hakkında + program + dahil listelerini yazar.
 * Tam reseed gerektirmez.
 */
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const BY_TITLE_PREFIX = {
  'Kapadokya Peri Bacaları': {
    description:
      'Kapadokya’nın peri bacaları, vadileri ve yeraltı şehirleri arasında üç günlük bir kültür kaçamakı. Göreme ve Uçhisar çevresinde panoramik seyir noktaları, açık hava müzesi ziyareti ve Avanos’ta geleneksel çömlek atölyesi deneyimi sizi bekliyor. Akşamları mağara otelde dinlenirken bölgenin sakin temposunu hissedersiniz; sabah erken saatlerde vadi yürüyüşü veya isteğe bağlı sıcak hava balonu için serbest zaman bırakılır. Küçük grup temposu sayesinde fotoğraf molaları ve yerel lezzet durakları acele etmeden planlanır. Tur, Nevşehir kalkışlıdır; transferler klimalı araçla yapılır ve tüm gezi noktalarında lisanslı rehber eşlik eder.',
    inclusions: [
      'Profesyonel lisanslı tur rehberi',
      'Klimalı araç ile şehirler arası ve bölge içi transferler',
      '2 gece butik / mağara konseptli konaklama (kahvaltı dahil)',
      'Göreme Açık Hava Müzesi giriş ücreti',
      'Avanos çömlek atölyesi kısa deneyimi',
    ],
    exclusions: [
      'Uçak / otobüs gidiş-dönüş biletleri',
      'Öğle ve akşam yemekleri',
      'Sıcak hava balonu (opsiyonel ekstra)',
      'Kişisel harcamalar ve hediyelik',
      'Seyahat sigortası',
    ],
    itinerary: {
      day0: {
        title: '1. Gün — Göreme & Uçhisar',
        description:
          'Nevşehir’de buluşma sonrası Göreme vadisine geçiş. Uçhisar Kalesi’nden panoramik manzara, vadi yürüyüşü ve akşam mağara otelde konaklama.',
        highlights: ['Uçhisar manzarası', 'Vadi yürüyüşü', 'Mağara otel'],
      },
      day1: {
        title: '2. Gün — Müze & Avanos',
        description:
          'Göreme Açık Hava Müzesi’nde kaya kiliseleri; öğleden sonra Kızılırmak kenarında Avanos çömlek atölyesi ve serbest zaman.',
        highlights: ['Açık hava müzesi', 'Çömlek deneyimi'],
      },
      day2: {
        title: '3. Gün — Ürgüp & dönüş',
        description:
          'Ürgüp tarihi dokusunda kısa tur, son fotoğraf molası ve kalkış noktasına dönüş.',
        highlights: ['Ürgüp gezisi', 'Dönüş transferi'],
      },
    },
  },
  'Antalya Likya Yolu': {
    description:
      'Likya Yolu’nun en keyifli sahil ve antik kent kesitlerini birleştiren dört günlük doğa turu. Antalya kalkışlı programda Patara–Kaş–Kekova hattında yürüyüş, tekne molası ve antik kalıntı ziyaretleri dengeli bir tempoda sunulur. Sabahları erken çıkışlarla sıcaktan korunur, öğleden sonraları denize girme veya gölgede dinlenme için esnek zaman bırakılır. Konaklamalar bölgeye özgü butik otel veya pansiyonlarda; kahvaltılar pakete dahildir. Orta seviye yürüyüş kondisyonu yeterlidir; zorlu pasajlarda alternatif kısa rotalar önerilir. Rehber eşliğinde güvenlik brifingi ve günlük su ikmali planlanmıştır.',
    inclusions: [
      'Doğa yürüyüşü deneyimli rehber',
      'Antalya kalkış–varış transferleri',
      '3 gece konaklama (kahvaltı dahil)',
      'Günlük yürüyüş güzergâhında su ikmali',
      'Kekova tekne turu (program gününde)',
    ],
    exclusions: [
      'Öğle / akşam yemekleri ve içecekler',
      'Müze ve ören yeri girişleri (belirtilenler hariç)',
      'Kişisel trekking ekipmanı',
      'Seyahat ve sağlık sigortası',
    ],
    itinerary: {
      day0: {
        title: '1. Gün — Antalya → Patara',
        description:
          'Kalkış ve Patara sahil / antik kent tanıtımı. Akşam konaklama ve ertesi gün yürüyüş brifingi.',
        highlights: ['Patara', 'Brifing'],
      },
      day1: {
        title: '2. Gün — Sahil patikası',
        description:
          'Likya Yolu’nun denize bakan bölümünde yürüyüş, öğle molası ve Kaş’a geçiş.',
        highlights: ['Sahil yürüyüşü', 'Kaş'],
      },
      day2: {
        title: '3. Gün — Kekova',
        description:
          'Kekova batık kent tekne turu, yüzme molası ve serbest keşif zamanı.',
        highlights: ['Kekova teknesi', 'Yüzme'],
      },
      day3: {
        title: '4. Gün — Dönüş',
        description: 'Kısa sabah gezisi sonrası Antalya’ya dönüş transferi.',
        highlights: ['Dönüş'],
      },
    },
  },
  'İstanbul Boğaz & Tarih': {
    description:
      'İstanbul’un tarihî yarımadasını ve Boğaz silüetini tek günde özetleyen kompakt kültür turu. Ayasofya ve Sultanahmet çevresinde rehberli anlatım, Kapalıçarşı’da kısa serbest zaman ve öğleden sonra Boğaz hattında manzara molası ile gün tamamlanır. Tempo yürüyüş ağırlıklıdır; uygun ayakkabı önerilir. Öğle yemeği için yerel restoran önerileri paylaşılır (yemek ücrete dahil değildir). Küçük grup sayesinde kalabalık noktalarda toplanma ve fotoğraf aralıkları daha rahat yönetilir. Tur İstanbul içi belirtilen kalkış noktalarından başlar ve aynı gün akşam saatlerinde sona erer.',
    inclusions: [
      'İstanbul uzmanı profesyonel rehber',
      'Şehir içi transfer (program güzergâhı)',
      'Müze kartı olmayanlar için temel ören yeri girişi (programda belirtilen)',
    ],
    exclusions: [
      'Öğle yemeği ve içecekler',
      'Boğaz tekne turu (opsiyonel)',
      'Kişisel alışveriş',
      'Ek müze girişleri',
    ],
    itinerary: {
      day0: {
        title: 'Günübirlik — Tarihi Yarımada & Boğaz',
        description:
          'Sultanahmet bölgesi gezisi, Kapalıçarşı molası ve Boğaz manzaralı kapanış. Akşam kalkış noktasına dönüş.',
        highlights: ['Sultanahmet', 'Kapalıçarşı', 'Boğaz manzarası'],
      },
    },
  },
  'Ege Gastronomi Rotası': {
    description:
      'Ege’nin zeytinyağlıları, deniz mahsulleri ve bağ rotasını bir araya getiren üç günlük gastronomi turu. İzmir kalkışlı programda yerel pazar ziyareti, şef eşliğinde tadım menüsü ve Urla / Çeşme hattında bağ-şarap deneyimi yer alır. Günler lezzet odaklı planlanır; aralarda kısa kültür durakları ile tempo dengelenir. Konaklama butik otelde kahvaltı dahildir; özel tadım akşam yemeklerinden biri pakete dahil edilir. Alerji ve diyet tercihlerinizi rezervasyon notuna yazmanız önerilir — mutfak ekibi mümkün olduğunca uyarlar. Alkol tadımı 18 yaş üstü misafirler içindir; alternatifi meşrubat / zeytinyağı tadımıdır.',
    inclusions: [
      'Gastronomi temalı rehberlik',
      '2 gece butik otel (kahvaltı dahil)',
      '1 akşam tadım menüsü',
      'Bağ / zeytinyağı tadım durakları',
      'İzmir içi ve rota transferleri',
    ],
    exclusions: [
      'Öğle yemekleri (belirtilen tadım hariç)',
      'Ekstra alkollü içecekler',
      'Kişisel harcamalar',
      'Seyahat sigortası',
    ],
    itinerary: {
      day0: {
        title: '1. Gün — İzmir lezzetleri',
        description:
          'Kemeraltı / pazar turu, zeytinyağlı tadım ve butik otelde check-in. Akşam dahil tadım menüsü.',
        highlights: ['Pazar turu', 'Tadım menüsü'],
      },
      day1: {
        title: '2. Gün — Urla bağları',
        description:
          'Urla’da bağ gezisi ve şarap / zeytinyağı tadımı, öğleden sonra serbest zaman.',
        highlights: ['Urla', 'Bağ tadımı'],
      },
      day2: {
        title: '3. Gün — Çeşme & dönüş',
        description:
          'Çeşme’de kısa sahil molası, son lezzet durağı ve İzmir’e dönüş.',
        highlights: ['Çeşme', 'Dönüş'],
      },
    },
  },
  'Karadeniz Yayla Escape': {
    description:
      'Doğu Karadeniz’in yaylalarını, vadilerini ve kültür duraklarını kapsayan sekiz günlük macera kaçamakı. Trabzon kalkışlı rotada Sümela Manastırı, Uzungöl, Ayder, Zilkale ve Pokut gibi ikonik noktalar günlere yayılır; her gün rehber eşliğinde gezi, kısa yürüyüş ve yöresel lezzet molaları planlanır. Konaklamalar dağ evi ve yayla oteli karışımıdır; kahvaltılar dahildir. Bulut denizi için erken kalkışlar önerilir — hava koşullarına göre sıra esnetilebilir. Orta seviye yürüyüş yeterlidir; yağmurluk ve katmanlı giysi şarttır. Grup temposu fotoğraf ve çay molalarına izin verecek şekilde tutulur. Acil durumlar için rehber iletişim bilgisi turdan bir gün önce SMS ile paylaşılır.',
    inclusions: [
      'Profesyonel bölge rehberi',
      'Klimalı araç ile tüm rota transferleri',
      '7 gece konaklama (kahvaltı dahil)',
      'Sümela Manastırı giriş ücreti',
      'Programdaki kısa yayla yürüyüşleri',
      '7/24 operasyon hattı desteği',
    ],
    exclusions: [
      'Şehirlerarası uçak / otobüs bileti',
      'Öğle ve akşam yemekleri',
      'Teleferik / ekstra aktivite ücretleri',
      'Kişisel harcamalar ve hediyelik',
      'Seyahat sigortası',
    ],
    itinerary: {
      day0: {
        title: '1. Gün — Trabzon & Sümela',
        description:
          'Trabzon’da buluşma, Sümela Manastırı ziyareti ve Uzungöl’e geçiş. Akşam dağ evinde konaklama.',
        highlights: ['Sümela', 'Uzungöl'],
      },
      day1: {
        title: '2. Gün — Uzungöl & çevresi',
        description:
          'Göl kenarı yürüyüşü, yöresel kahvaltı sonrası serbest zaman ve fotoğraf molaları.',
        highlights: ['Göl yürüyüşü', 'Yöresel lezzet'],
      },
      day2: {
        title: '3. Gün — Ayder yolu',
        description:
          'Çamlıhemşin’e geçiş, Fırtına Vadisi manzaraları ve Ayder’de konaklama.',
        highlights: ['Fırtına Vadisi', 'Ayder'],
      },
      day3: {
        title: '4. Gün — Zilkale & yayla',
        description:
          'Zilkale gezisi, kısa vadi yürüyüşü ve termal / dinlenme molası.',
        highlights: ['Zilkale', 'Vadi'],
      },
      day4: {
        title: '5. Gün — Pokut',
        description:
          'Pokut Yaylası’nda bulut denizi seyri (hava uygunsa), çay molası ve dönüş.',
        highlights: ['Pokut', 'Bulut denizi'],
      },
      day5: {
        title: '6. Gün — Yayla serbest gün',
        description:
          'İsteğe bağlı kısa yürüyüş veya dinlenme; yöresel pazar ve el sanatları için serbest zaman.',
        highlights: ['Serbest zaman', 'Yöresel pazar'],
      },
      day6: {
        title: '7. Gün — Çamlıhemşin',
        description:
          'Merkezde lezzet durağı, son fotoğraf noktaları ve akşam veda yemeği önerisi.',
        highlights: ['Çamlıhemşin', 'Lezzet'],
      },
      day7: {
        title: '8. Gün — Trabzon dönüş',
        description:
          'Kahvaltı sonrası eşya toplama, Trabzon’a dönüş transferi ve tur kapanışı.',
        highlights: ['Dönüş transferi'],
      },
    },
  },
};

function matchCopy(title) {
  for (const [prefix, copy] of Object.entries(BY_TITLE_PREFIX)) {
    if (title.startsWith(prefix)) return copy;
  }
  return null;
}

async function main() {
  const tours = await prisma.tour.findMany({
    where: { deletedAt: null, slug: { startsWith: 'seed-tour-' } },
    select: { id: true, title: true, slug: true, extras: true },
  });

  let updated = 0;
  for (const tour of tours) {
    const copy = matchCopy(tour.title);
    if (!copy) {
      console.log(`skip ${tour.slug}`);
      continue;
    }
    const prev =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? { ...tour.extras }
        : {};
    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        description: copy.description,
        extras: {
          ...prev,
          inclusions: copy.inclusions,
          exclusions: copy.exclusions,
          itinerary: copy.itinerary,
        },
      },
    });
    updated += 1;
    console.log(`updated ${tour.slug}`);
  }
  console.log(JSON.stringify({ total: tours.length, updated }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
