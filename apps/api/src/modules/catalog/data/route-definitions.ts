/** Curated destination routes — faz-1 Ankara çıkışlı vitrin odaklı. */

export type RouteCategory =
  'historical' | 'nature' | 'beach' | 'gastronomy' | 'family';

export interface RouteDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  location: string;
  /** Homepage badge / cluster label (optional). */
  clusterLabel?: string;
  bestTimeToVisit: string;
  weather: string;
  transportation: string;
  duration: string;
  highlights: string[];
  category: RouteCategory;
  /** Lowercase keywords matched against tour name, description, region, destinations, tags */
  matchKeywords: string[];
}

export interface RouteFilters {
  search?: string;
  category?: string;
  duration?: string;
  season?: string;
}

export interface RouteWithStats extends RouteDefinition {
  tourCount: number;
  priceRange: string | null;
  avgRating: number | null;
  computedDuration: string | null;
}

export const ROUTE_CATEGORY_LABELS: Record<
  RouteCategory,
  { name: string; description: string; color: string }
> = {
  historical: {
    name: 'Tarihi & Kültürel',
    description:
      'Antik kentler, müzeler ve tarihi mekanlarıyla kültürel keşifler',
    color: 'bg-amber-100 text-amber-600',
  },
  nature: {
    name: 'Doğa & Manzara',
    description:
      'Doğal güzelliklerle dolu, fotoğraf tutkunları için ideal rotalar',
    color: 'bg-green-100 text-green-600',
  },
  beach: {
    name: 'Deniz & Plaj',
    description: 'Turkuaz sularla çevrili muhteşem koylar ve plajlar',
    color: 'bg-blue-100 text-blue-600',
  },
  gastronomy: {
    name: 'Gastronomi',
    description: 'Yöresel lezzetler ve mutfak kültürüyle öne çıkan rotalar',
    color: 'bg-red-100 text-red-600',
  },
  family: {
    name: 'Aile Dostu',
    description:
      'Çocuklu aileler için ideal, herkesin keyif alabileceği destinasyonlar',
    color: 'bg-purple-100 text-purple-600',
  },
};

/** Ana sayfa Popüler Rotalar sırası (Ankara çıkışlı 4 küme). */
export const HOMEPAGE_ROUTE_IDS = [
  'kapadokya',
  'amasra-safranbolu',
  'gap-mezopotamya',
  'abant-yedigoller',
] as const;

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    id: 'kapadokya',
    name: 'Kapadokya',
    clusterLabel: 'Hafta Sonu Kaçamağı',
    description:
      "Peri bacaları, yeraltı şehirleri ve balon turlarıyla Ankara'dan 3 saat mesafede unutulmaz bir hafta sonu kaçamağı.",
    longDescription: `Kapadokya, Ankara çıkışlı gezginler için en yakın “wow” destinasyonlarından biridir. Peri bacaları, yeraltı şehirleri ve vadileriyle kısa mesafede yoğun bir deneyim sunar.

Balon izleme, vadi yürüyüşleri ve Göreme çevresi kültür noktaları hafta sonu programlarına ideal uyum sağlar.`,
    image:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=2070&q=80',
    location: 'Nevşehir',
    bestTimeToVisit: 'Nisan - Ekim',
    weather: 'Yazları sıcak (25-35°C), kışları soğuk (-5-5°C)',
    transportation: "Ankara'dan karayolu ile yaklaşık 3 saat",
    duration: '2-3 gün',
    highlights: ['Balon İzleme', 'Göreme', 'Uçhisar', 'Vadiler'],
    category: 'nature',
    matchKeywords: [
      'kapadokya',
      'göreme',
      'urgup',
      'ürgüp',
      'uchisar',
      'uçhisar',
      'avanos',
      'derinkuyu',
      'nevşehir',
      'peri bac',
      'soğanlı',
    ],
  },
  {
    id: 'amasra-safranbolu',
    name: 'Amasra & Safranbolu',
    clusterLabel: 'Batı Karadeniz',
    description:
      'Tarihi konaklar, Amasra kalesi ve Karadeniz mutfağıyla günübirlik ve 1 gecelik turlar için ideal Batı Karadeniz rotası.',
    longDescription: `Safranbolu’nun UNESCO dokusu ve Amasra’nın deniz-kale silüeti, Ankara’dan kısa sürede ulaşılabilen klasik bir kültür-deniz birleşimidir.

Günübirlik veya 1 gecelik programlarla konak sokakları, liman ve yöresel lezzetler dengeli bir tempoda sunulur.`,
    image:
      'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=1600',
    location: 'Bartın & Karabük',
    bestTimeToVisit: 'Mayıs - Ekim',
    weather: 'Nemli Karadeniz iklimi',
    transportation: "Ankara'dan karayolu ile yaklaşık 4-5 saat",
    duration: '1-2 gün',
    highlights: ['Safranbolu', 'Amasra Kalesi', 'Konaklar', 'Balık'],
    category: 'historical',
    matchKeywords: [
      'amasra',
      'safranbolu',
      'bartın',
      'bartin',
      'karabük',
      'karabuk',
      'batı karadeniz',
    ],
  },
  {
    id: 'gap-mezopotamya',
    name: 'GAP & Mezopotamya',
    clusterLabel: 'Kültür Rotaları',
    description:
      "Mardin, Göbeklitepe, Şanlıurfa ve Halfeti'yi kapsayan konaklamalı kültür turları.",
    longDescription: `GAP hattı; Mardin taş mimarisi, Urfa’nın inanç ve kültür dokusu, Göbeklitepe ve Halfeti ile Ankara çıkışlı konaklamalı kültür severlere hitap eder.

Bayram ve bahar dönemlerinde 4–6 günlük programlar en çok tercih edilir.`,
    image:
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
    location: 'Mardin & Şanlıurfa',
    bestTimeToVisit: 'Mart - Mayıs, Eylül - Kasım',
    weather: 'Yazları sıcak, ilkbahar/sonbahar ılıman',
    transportation: "Ankara'dan otobüs veya uçuş + bölge transferi",
    duration: '4-6 gün',
    highlights: ['Mardin', 'Göbeklitepe', 'Şanlıurfa', 'Halfeti'],
    category: 'historical',
    matchKeywords: [
      'gap',
      'mardin',
      'şanlıurfa',
      'sanliurfa',
      'urfa',
      'göbeklitepe',
      'gobeklitepe',
      'halfeti',
      'mezopotamya',
    ],
  },
  {
    id: 'abant-yedigoller',
    name: 'Abant & Yedigöller',
    clusterLabel: 'Doğa & Günübirlik',
    description:
      "Ankara'dan hafta sonu nefes almak isteyenler için göl manzaralı doğa ve yürüyüş rotaları.",
    longDescription: `Abant Gölü ve Yedigöller, Ankara’ya en yakın doğa kaçışlarından biridir. Göl çevresi yürüyüşleri, orman havası ve piknik molaları günübirlik programlara çok uygundur.`,
    image:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
    location: 'Bolu',
    bestTimeToVisit: 'Mayıs - Ekim',
    weather: 'Serin orman iklimi',
    transportation: "Ankara'dan karayolu ile yaklaşık 2-2.5 saat",
    duration: '1 gün',
    highlights: ['Abant Gölü', 'Yedigöller', 'Doğa yürüyüşü', 'Fotoğraf'],
    category: 'nature',
    matchKeywords: [
      'abant',
      'yedigöller',
      'yedigoller',
      'bolu',
      'göl',
      'gol',
      'doğa',
    ],
  },
  {
    id: 'likya-yolu',
    name: 'Likya Yolu',
    description:
      'Antik Likya uygarlığının izlerini takip eden, deniz manzaralı yürüyüş rotası.',
    longDescription: `Likya Yolu, Akdeniz kıyısı boyunca uzanan dünyanın en güzel yürüyüş rotalarından biridir. Ankara çıkışlı konaklamalı programlarla Kaş–Patara–Fethiye hattı birleştirilebilir.`,
    image:
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=2070&q=80',
    location: 'Antalya & Muğla',
    bestTimeToVisit: 'Mart - Mayıs, Eylül - Kasım',
    weather: 'Ilıman Akdeniz iklimi',
    transportation: 'Ankara’dan otobüs/uçuş + kara transferi',
    duration: '5-7 gün',
    highlights: [
      'Antik Kentler',
      'Deniz Manzarası',
      'Doğa Yürüyüşü',
      'Plajlar',
    ],
    category: 'nature',
    matchKeywords: [
      'likya',
      'lycian',
      'kaş',
      'kas',
      'kalkan',
      'fethiye',
      'olimpos',
      'olympos',
      'patara',
      'ege',
    ],
  },
  {
    id: 'dogu-karadeniz',
    name: 'Doğu Karadeniz Yaylaları',
    description:
      'Uzungöl, Ayder ve sisli yaylalarla Ankara çıkışlı konaklamalı doğa rotası.',
    longDescription: `Doğu Karadeniz yaylaları; Uzungöl ve Ayder başta olmak üzere sis, çay ve yeşil yamaçlarla unutulmaz bir doğa deneyimi sunar.`,
    image:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
    location: 'Trabzon & Rize',
    bestTimeToVisit: 'Haziran - Eylül',
    weather: 'Yağışlı ve serin',
    transportation: 'Ankara’dan otobüs veya uçuş + transfer',
    duration: '4-6 gün',
    highlights: ['Uzungöl', 'Ayder', 'Yaylalar', 'Doğa'],
    category: 'nature',
    matchKeywords: [
      'uzungöl',
      'uzungol',
      'ayder',
      'trabzon',
      'rize',
      'yayla',
      'karadeniz',
    ],
  },
];
