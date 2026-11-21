/** Shared demo seed constants — password Demo1234! for all actors. */
export const DEMO_PASSWORD = 'Demo1234!';

export const COUNT = 5;

export const TOURS_PER_AGENCY = 8;
export const EXPERIENCES_PER_AGENCY = 8;

/** Ankara merkezli faz-1 demo acenteleri. */
export const AGENCY_PROFILES = [
  { name: 'Başkent Turizm', city: 'Ankara' },
  { name: 'Anadolu Rotaları', city: 'Ankara' },
  { name: 'Angora Gezi', city: 'Ankara' },
  { name: 'Hitit Seyahat', city: 'Ankara' },
  { name: 'Kızılay Tur', city: 'Ankara' },
] as const;

/** @deprecated use AGENCY_PROFILES — kept for older seed helpers */
export const AGENCY_CITIES = AGENCY_PROFILES.map((a) => a.city);

/** Fallback only — prefer destination covers on templates. */
export const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
  'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
] as const;

const day = (
  title: string,
  description: string,
  highlights: string[],
  imageUrls: string[],
  accommodation: string | null = null,
) => ({
  title,
  description,
  highlights,
  meals: {
    breakfast: accommodation ? ('INCLUDED' as const) : ('EXCLUDED' as const),
    lunch: 'FREE_TIME' as const,
    dinner: accommodation ? ('EXCLUDED' as const) : ('EXCLUDED' as const),
  },
  accommodation,
  imageUrls,
});

/**
 * Ankara çıkışlı tur şablonları — destinasyon görselleri birebir eşleşir.
 * Fiyat bantları: günübirlik/1 gece 1.100–3.500; konaklamalı kültür 12.000–18.000.
 */
export const TOUR_TEMPLATES = [
  {
    title: 'Beypazarı Tarihi Konaklar',
    city: 'Beypazarı',
    category: 'CULTURAL' as const,
    days: 1,
    price: 1290,
    coverUrl:
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
    galleryUrls: [
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
      'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=1600',
    ],
    description:
      'Ankara’dan günübirlik Beypazarı: tarihi konaklar, çarşı sokakları ve yerel lezzet molası. Küçük grup temposuyla fotoğraf ve gastronomi odaklı rahat bir kaçış.',
    inclusions: [
      'Ankara kalkış–dönüş klimalı transfer',
      'Lisanslı rehber',
      'Kısa çarşı yürüyüşü',
    ],
    exclusions: ['Öğle yemeği', 'Kişisel harcamalar', 'Müze girişleri'],
    itinerary: {
      day0: day(
        '1. Gün — Beypazarı',
        'Sabah Ankara’dan hareket, Beypazarı konaklar ve çarşı, öğleden sonra dönüş.',
        ['Tarihi konaklar', 'Yerel lezzet', 'Ankara dönüş'],
        [
          'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ],
      ),
    },
  },
  {
    title: 'Abant & Yedigöller Doğa',
    city: 'Bolu',
    category: 'NATURE' as const,
    days: 1,
    price: 1590,
    coverUrl:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
      'https://images.pexels.com/photos/3889650/pexels-photo-3889650.jpeg?auto=compress&cs=tinysrgb&w=1600',
    ],
    description:
      'Ankara’dan günübirlik Abant Gölü ve Yedigöller doğa rotası. Göl kenarı yürüyüşü, orman havası ve hafta sonu nefes molası.',
    inclusions: [
      'Ankara kalkış–dönüş transfer',
      'Doğa rehberi',
      'Milli park giriş planlaması',
    ],
    exclusions: ['Öğle yemeği', 'Kişisel ekipman'],
    itinerary: {
      day0: day(
        '1. Gün — Abant & Yedigöller',
        'Ankara çıkış, Abant göl çevresi, Yedigöller kısa yürüyüş ve akşam dönüş.',
        ['Abant Gölü', 'Yedigöller', 'Doğa yürüyüşü'],
        [
          'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
        ],
      ),
    },
  },
  {
    title: 'Amasra & Safranbolu Kaçamağı',
    city: 'Bartın',
    category: 'CULTURAL' as const,
    days: 2,
    price: 2890,
    coverUrl:
      'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1600',
    galleryUrls: [
      'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1600',
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
    ],
    description:
      'Ankara çıkışlı 1 gecelik Batı Karadeniz: Safranbolu konakları, Amasra kalesi ve Karadeniz mutfağı. Ekonomik hafta sonu kültürü.',
    inclusions: [
      'Ankara kalkış–dönüş transfer',
      '1 gece konaklama (kahvaltı dahil)',
      'Rehber eşliği',
    ],
    exclusions: ['Öğle/akşam yemekleri', 'Müze girişleri'],
    itinerary: {
      day0: day(
        '1. Gün — Safranbolu',
        'Ankara’dan hareket, Safranbolu çarşısı ve konaklar, akşam konaklama.',
        ['Safranbolu', 'Tarihi konaklar'],
        [
          'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ],
        'Safranbolu — butik otel',
      ),
      day1: day(
        '2. Gün — Amasra & dönüş',
        'Amasra kalesi ve liman, öğleden sonra Ankara’ya dönüş.',
        ['Amasra', 'Kale', 'Dönüş'],
        [
          'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ],
      ),
    },
  },
  {
    title: 'Kapadokya Hafta Sonu',
    city: 'Nevşehir',
    category: 'CULTURAL' as const,
    days: 2,
    price: 3490,
    coverUrl:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1600&q=80',
      'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=1600',
    ],
    description:
      'Ankara’dan ~3 saat mesafede Kapadokya hafta sonu: peri bacaları, Göreme vadisi ve isteğe bağlı balon izleme. 1 gece konaklamalı ekonomik kaçış.',
    inclusions: [
      'Ankara kalkış–dönüş transfer',
      '1 gece konaklama (kahvaltı dahil)',
      'Göreme / Uçhisar programı',
      'Lisanslı rehber',
    ],
    exclusions: ['Balon uçuşu', 'Öğle/akşam yemekleri', 'Müze girişleri'],
    itinerary: {
      day0: day(
        '1. Gün — Göreme & Uçhisar',
        'Ankara çıkış, Göreme vadisi ve Uçhisar manzarası, akşam konaklama.',
        ['Peri bacaları', 'Uçhisar'],
        [
          'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1600&q=80',
        ],
        'Göreme — butik otel',
      ),
      day1: day(
        '2. Gün — Açık hava müzesi & dönüş',
        'Kısa müze/vadi turu ve Ankara’ya dönüş.',
        ['Göreme', 'Dönüş'],
        [
          'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ],
      ),
    },
  },
  {
    title: 'Tuz Gölü Gün Batımı',
    city: 'Şereflikoçhisar',
    category: 'NATURE' as const,
    days: 1,
    price: 1190,
    coverUrl:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Ankara’dan günübirlik Tuz Gölü fotoğraf turu: pembe-altın saat ışığı, ayna efekti ve kısa doğa molası. Hafif tempolu, aile dostu program.',
    inclusions: [
      'Ankara kalkış–dönüş transfer',
      'Fotoğraf noktası planlaması',
      'Rehber',
    ],
    exclusions: ['Yemekler', 'Kişisel fotoğraf ekipmanı'],
    itinerary: {
      day0: day(
        '1. Gün — Tuz Gölü',
        'Öğleden sonra hareket, gün batımı çekimi ve gece Ankara dönüşü.',
        ['Tuz Gölü', 'Gün batımı', 'Fotoğraf'],
        [
          'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80',
        ],
      ),
    },
  },
  {
    title: 'GAP & Mezopotamya Kültür',
    city: 'Mardin',
    category: 'CULTURAL' as const,
    days: 5,
    price: 14500,
    coverUrl:
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Ankara çıkışlı konaklamalı GAP kültürü: Mardin taş sokakları, Şanlıurfa, Göbeklitepe ve Halfeti. Bayram ve bahar dönemine uygun kültür rotası.',
    inclusions: [
      'Ankara kalkış–dönüş otobüs',
      '4 gece konaklama (kahvaltı dahil)',
      'Lisanslı kültür rehberi',
      'Programdaki ören yeri girişleri (belirtilenler)',
    ],
    exclusions: ['Öğle/akşam yemekleri', 'Kişisel harcamalar', 'Uçak opsiyonu'],
    itinerary: {
      day0: day(
        '1. Gün — Ankara → Mardin',
        'Ankara’dan hareket, Mardin’e varış ve kısa şehir turu.',
        ['Mardin'],
        [
          'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
        ],
        'Mardin — butik otel',
      ),
      day1: day(
        '2. Gün — Mardin',
        'Tarihi sokaklar, manastır ve panoramik seyir.',
        ['Taş mimari', 'Kültür'],
        [
          'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
        ],
        'Mardin — butik otel',
      ),
      day2: day(
        '3. Gün — Urfa & Göbeklitepe',
        'Şanlıurfa merkezi ve Göbeklitepe ziyareti.',
        ['Göbeklitepe', 'Urfa'],
        [
          'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1600&q=80',
        ],
        'Şanlıurfa — otel',
      ),
      day3: day(
        '4. Gün — Halfeti',
        'Halfeti tekne/seyir ve yöresel tempo.',
        ['Halfeti'],
        [
          'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
        ],
        'Şanlıurfa — otel',
      ),
      day4: day(
        '5. Gün — Dönüş',
        'Kahvaltı sonrası Ankara’ya dönüş.',
        ['Dönüş'],
        [
          'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
        ],
      ),
    },
  },
  {
    title: 'Doğu Karadeniz Yaylalar',
    city: 'Trabzon',
    category: 'NATURE' as const,
    days: 5,
    price: 15500,
    coverUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
      'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1600',
    ],
    description:
      'Ankara çıkışlı Doğu Karadeniz yayla turu: Uzungöl, Ayder ve sisli yayla manzaraları. Konaklamalı, doğa tempolu bahar/bayram programı.',
    inclusions: [
      'Ankara kalkış–dönüş transfer',
      '4 gece konaklama (kahvaltı dahil)',
      'Doğa rehberi',
      'Yayla güzergâh transferleri',
    ],
    exclusions: ['Öğle/akşam yemekleri', 'Teleferik vb. ekstralar'],
    itinerary: {
      day0: day(
        '1. Gün — Ankara → Trabzon hattı',
        'Ankara’dan hareket, bölgeye varış.',
        ['Transfer'],
        [
          'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ],
        'Trabzon — otel',
      ),
      day1: day(
        '2. Gün — Uzungöl',
        'Uzungöl çevresi ve yayla manzarası.',
        ['Uzungöl'],
        [
          'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
        ],
        'Uzungöl — pansiyon',
      ),
      day2: day(
        '3. Gün — Ayder',
        'Ayder yaylası ve doğa yürüyüşü.',
        ['Ayder'],
        [
          'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ],
        'Ayder — otel',
      ),
      day3: day(
        '4. Gün — Yayla & serbest',
        'Yayla seyri ve serbest zaman.',
        ['Yayla'],
        [
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
        ],
        'Ayder — otel',
      ),
      day4: day(
        '5. Gün — Dönüş',
        'Ankara’ya dönüş.',
        ['Dönüş'],
        [
          'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ],
      ),
    },
  },
  {
    title: 'Likya & Ege Kıyı Kültür',
    city: 'Antalya',
    category: 'NATURE' as const,
    days: 6,
    price: 16800,
    coverUrl:
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Ankara çıkışlı Likya & Ege kıyı kültürü: Antalya–Kaş–Fethiye hattında koylar, antik izler ve deniz manzarası. Konaklamalı bahar dönemi rotası.',
    inclusions: [
      'Ankara kalkış–dönüş transfer',
      '5 gece konaklama (kahvaltı dahil)',
      'Rehber',
      'Seçili koy / antik kent ziyaretleri',
    ],
    exclusions: ['Öğle/akşam yemekleri', 'Tekne ekstraları'],
    itinerary: {
      day0: day(
        '1. Gün — Ankara → Antalya',
        'Ankara’dan hareket, Antalya’ya varış.',
        ['Antalya'],
        [
          'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
        ],
        'Antalya — otel',
      ),
      day1: day(
        '2. Gün — Antalya çevresi',
        'Kaleiçi / sahil hattı keşfi.',
        ['Kaleiçi'],
        [
          'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
        ],
        'Antalya — otel',
      ),
      day2: day(
        '3. Gün — Kaş',
        'Kaş koyları ve sakin tempo.',
        ['Kaş'],
        [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        ],
        'Kaş — butik otel',
      ),
      day3: day(
        '4. Gün — Patara / Xanthos',
        'Antik izler ve sahil.',
        ['Patara'],
        [
          'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
        ],
        'Kaş — butik otel',
      ),
      day4: day(
        '5. Gün — Fethiye / Ölüdeniz',
        'Ölüdeniz manzarası ve serbest zaman.',
        ['Ölüdeniz'],
        [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        ],
        'Fethiye — otel',
      ),
      day5: day(
        '6. Gün — Dönüş',
        'Ankara’ya dönüş.',
        ['Dönüş'],
        [
          'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=1600&q=80',
        ],
      ),
    },
  },
] as const;

export const EXPERIENCE_TEMPLATES = [
  {
    title: 'Kapadokya Gün Doğumu Balon İzleme & Vadiler',
    location: 'Göreme',
    category: 'Doğa',
    duration: '4 saat',
    price: 1890,
    description:
      'Gün doğumunda peri bacaları üzerinde balon geçidini izleyin; vadi seyir noktası ve sıcak içecek molası. Ankara çıkışlı günübirlik bağlantılarla uyumlu.',
    descriptionVariants: [
      'Sabah balon silüetleri + kısa vadi yürüyüşü — fotoğraf için ideal açı.',
      'Aile dostu seyir terası; transfer ve rehber dahil planlama.',
      'Kapadokya sabah ritüeli: renkli balonlar ve sessiz izleme alanı.',
      'Uçuşa binmeden manzarayı yakalayın; hava kapalıysa alternatif vadi.',
      'Gün doğumu brifingi, seyir ve dönüş — küçük grup temposu.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Beypazarı Tarihi Konaklar & Gastronomi Yürüyüşü',
    location: 'Beypazarı',
    category: 'Gastronomi',
    duration: '5 saat',
    price: 990,
    description:
      'Beypazarı’nda konak sokakları, çarşı ve yerel tatlar eşliğinde rehberli gastronomi yürüyüşü. Ankara’ya yakın günübirlik deneyim.',
    descriptionVariants: [
      'Tarihi konaklar + tavuk göğsü / gümüş ustaları molası.',
      'Küçük grupla çarşı yürüyüşü ve tatlı molası.',
      'Aileler için rahat tempo; fotoğraf ve lezzet dengesi.',
      'Yerel üretici durakları ve kısa tarih anlatımı.',
      'Ankara’ya dönüşe uygun öğleden sonra programı.',
    ],
    imageUrl:
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1200',
    gallery: [
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    title: 'Tuz Gölü Gün Batımı Fotoğraf Turu',
    location: 'Şereflikoçhisar',
    category: 'Doğa',
    duration: '4 saat',
    price: 850,
    description:
      'Tuz Gölü’nde gün batımı ayna efekti için rehberli fotoğraf turu. Ankara’dan kısa mesafeli, hafif tempolu doğa deneyimi.',
    descriptionVariants: [
      'Altın saat ışığında tuz düzlükleri — tripod dostu noktalar.',
      'Aile ve çiftler için sakin seyir + kısa yürüyüş.',
      'Rehber en iyi açıları gösterir; hava durumuna göre esnek.',
      'Pembe-turuncu batışta yansıma kareleri.',
      'Ankara dönüşlü akşam programı.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Ilgaz Doğa Yürüyüşü',
    location: 'Kastamonu',
    category: 'Macera',
    duration: '6 saat',
    price: 1250,
    description:
      'Ilgaz ormanlarında rehberli doğa yürüyüşü; temiz hava, panoramik seyir ve piknik molası. Ankara çıkışlı günübirlik doğa kaçışı.',
    descriptionVariants: [
      'Orta tempo orman parkuru — uygun ayakkabı önerilir.',
      'Aile dostu kısa parkur seçeneği mevcuttur.',
      'Sisli sedir kokusu ve seyir terasları.',
      'Küçük grup, güvenlik brifingi dahil.',
      'Ankara’ya akşam dönüş planlı.',
    ],
    imageUrl:
      'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1200',
    gallery: [
      'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    title: 'Eymir Gölü Sabah Koşu & Kahvaltı',
    location: 'Ankara',
    category: 'Doğa',
    duration: '3 saat',
    price: 690,
    description:
      'Eymir Gölü çevresinde hafif tempo yürüyüş/koşu ve göl kenarı kahvaltı molası. Şehir içi nefes alma deneyimi.',
    descriptionVariants: [
      'Sabah serinliğinde göl parkuru.',
      'Kahvaltı molası ile sosyal tempo.',
      'Koşu veya yürüyüş seçenekli brifing.',
      'Ankara içi buluşma — transfer gerekmez.',
      'Küçük grup, motivasyon odaklı.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Gordion Antik Kent Gezisi',
    location: 'Polatlı',
    category: 'Kültür',
    duration: '4 saat',
    price: 780,
    description:
      'Polatlı Gordion’da Frig izleri ve tümülüs hattında rehberli kültür gezisi. Ankara’ya çok yakın yarım günlük tarih.',
    descriptionVariants: [
      'Antik kent ve müze odaklı anlatım.',
      'Aileler için sade dilde tarih turu.',
      'Fotoğraf molalı kısa parkur.',
      'Ankara merkeze kolay dönüş.',
      'Küçük grup, lisanslı rehber.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    title: 'Kızılcahamam Termal & Orman',
    location: 'Kızılcahamam',
    category: 'Doğa',
    duration: '5 saat',
    price: 1100,
    description:
      'Kızılcahamam’da orman havası ve termal bölge tanıtımı; kısa yürüyüş ve dinlenme molası. Ankara kuzeyi günübirlik.',
    descriptionVariants: [
      'Orman yürüyüşü + termal bölge brifingi.',
      'Rahat tempo, aile uyumlu.',
      'Doğa fotoğrafı için seyir noktaları.',
      'Ankara’ya akşamüstü dönüş.',
      'Küçük grup rehberliği.',
    ],
    imageUrl:
      'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1200',
    gallery: [
      'https://images.pexels.com/photos/167698/pexels-photo-167698.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    title: 'Soğanlı Vadisi Kısa Keşif',
    location: 'Kapadokya',
    category: 'Kültür',
    duration: '3 saat',
    price: 950,
    description:
      'Kapadokya Soğanlı Vadisi’nde sakin tempo keşif; kaya oyma doku ve fotoğraf molası. Ankara çıkışlı Kapadokya günleriyle uyumlu ek deneyim.',
    descriptionVariants: [
      'Kalabalıktan uzak vadi temposu.',
      'Fotoğraf odaklı kısa parkur.',
      'Rehberli tarih ve doğa anlatımı.',
      'Aile dostu, hafif yürüyüş.',
      'Göreme hattına kolay bağlantı.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1200&q=80',
    ],
  },
] as const;
