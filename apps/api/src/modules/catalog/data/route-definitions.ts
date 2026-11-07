/** Curated destination routes (legacy lib/routes.ts parity). */

export type RouteCategory =
  'historical' | 'nature' | 'beach' | 'gastronomy' | 'family';

export interface RouteDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  location: string;
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

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    id: 'kapadokya',
    name: 'Kapadokya',
    description:
      'Peri bacaları, yeraltı şehirleri ve balon turlarıyla unutulmaz bir deneyim.',
    longDescription: `Kapadokya, Türkiye'nin en etkileyici doğal ve tarihi bölgelerinden biridir. Peri bacaları, yeraltı şehirleri, antik kiliseler ve vadileriyle benzersiz bir deneyim sunar.

Balon turları, at turları, yürüyüş rotaları ve şarap tadımları gibi birçok aktivite seçeneği bulunmaktadır. Bölge, her mevsim farklı güzellikler sunar ve fotoğraf tutkunları için ideal bir destinasyondur.`,
    image:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=2070&q=80',
    location: 'Nevşehir, Türkiye',
    bestTimeToVisit: 'Nisan - Ekim',
    weather: 'Yazları sıcak (25-35°C), kışları soğuk (-5-5°C)',
    transportation:
      "Nevşehir Havalimanı'na uçuş veya Kayseri Havalimanı'na uçuş + 1 saat transfer",
    duration: '3-4 gün',
    highlights: ['Balon Turu', 'Yeraltı Şehirleri', 'Şarap Tadımı', 'At Turu'],
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
      'nevesehir',
      'peri bac',
    ],
  },
  {
    id: 'likya-yolu',
    name: 'Likya Yolu',
    description:
      'Antik Likya uygarlığının izlerini takip eden, deniz manzaralı yürüyüş rotası.',
    longDescription: `Likya Yolu, Akdeniz kıyısı boyunca uzanan dünyanın en güzel yürüyüş rotalarından biridir. Antik Likya kentlerinin kalıntıları, turkuaz koylar ve çam ormanları arasında unutulmaz bir trekking deneyimi sunar.`,
    image:
      'https://images.unsplash.com/photo-1593238739364-18cfde30e522?auto=format&fit=crop&w=2070&q=80',
    location: 'Antalya - Muğla, Türkiye',
    bestTimeToVisit: 'Mart - Mayıs, Eylül - Kasım',
    weather: 'Ilıman Akdeniz iklimi',
    transportation: 'Antalya veya Dalaman Havalimanı + kara transferi',
    duration: '7-8 gün',
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
      'demre',
      'kumluca',
      'patara',
      'xanthos',
    ],
  },
  {
    id: 'pamukkale',
    name: 'Pamukkale & Hierapolis',
    description: 'Travertenler ve antik havuzuyla dünyaca ünlü doğa harikası.',
    longDescription: `Pamukkale, beyaz traverten terasları ve üzerindeki Hierapolis antik kentiyle UNESCO Dünya Mirası Listesi'nde yer alan eşsiz bir destinasyondur.`,
    image:
      'https://images.unsplash.com/photo-1720974613560-e65ad8b37ca9?auto=format&fit=crop&w=2070&q=80',
    location: 'Denizli, Türkiye',
    bestTimeToVisit: 'Mart - Kasım',
    weather: 'Yazları sıcak, kışları ılıman',
    transportation: 'Denizli Çardak Havalimanı veya İzmir/Antalya + kara yolu',
    duration: '1-2 gün',
    highlights: [
      'Travertenler',
      'Antik Havuz',
      'Hierapolis',
      'Kleopatra Havuzu',
    ],
    category: 'historical',
    matchKeywords: [
      'pamukkale',
      'hierapolis',
      'denizli',
      'traverten',
      'kleopatra',
    ],
  },
  {
    id: 'efes',
    name: 'Efes Antik Kenti',
    description: "Roma İmparatorluğu'nun en önemli antik kentlerinden biri.",
    longDescription: `Efes, dünyanın en iyi korunmuş antik kentlerinden biridir. Celsus Kütüphanesi, Büyük Tiyatro ve Artemis Tapınağı kalıntılarıyla tarih meraklılarının vazgeçilmez durağıdır.`,
    image:
      'https://images.unsplash.com/photo-1700855553036-47b91c5f4aaa?auto=format&fit=crop&w=2070&q=80',
    location: 'Selçuk, İzmir',
    bestTimeToVisit: 'Mart - Kasım',
    weather: 'Ilıman Ege iklimi',
    transportation: 'İzmir Adnan Menderes Havalimanı + 1 saat transfer',
    duration: '1 gün',
    highlights: [
      'Celsus Kütüphanesi',
      'Büyük Tiyatro',
      'Hadrian Tapınağı',
      'Antik Agora',
    ],
    category: 'historical',
    matchKeywords: [
      'efes',
      'ephesus',
      'selçuk',
      'selcuk',
      'meryem ana',
      'artemis',
    ],
  },
  {
    id: 'fethiye-oludeniz',
    name: 'Fethiye - Ölüdeniz',
    description: 'Muhteşem koylar ve plajlarla çevrili doğa cenneti.',
    longDescription: `Fethiye ve Ölüdeniz, turkuaz suları, Kelebekler Vadisi ve yamaç paraşütü imkânlarıyla Akdeniz'in en popüler tatil rotalarından biridir.`,
    image:
      'https://images.unsplash.com/photo-1719451642957-172abf017863?auto=format&fit=crop&w=2070&q=80',
    location: 'Muğla, Türkiye',
    bestTimeToVisit: 'Mayıs - Ekim',
    weather: 'Sıcak yazlar, ılıman kışlar',
    transportation: 'Dalaman Havalimanı + 1 saat transfer',
    duration: '2-3 gün',
    highlights: [
      'Ölüdeniz Plajı',
      'Kelebekler Vadisi',
      'Paragliding',
      'Tekne Turu',
    ],
    category: 'beach',
    matchKeywords: [
      'fethiye',
      'ölüdeniz',
      'oludeniz',
      'kelebekler vadisi',
      'babadag',
      'babadağ',
    ],
  },
  {
    id: 'istanbul',
    name: 'İstanbul - Tarihi Yarımada',
    description:
      'Medeniyetlerin buluşma noktasında binlerce yıllık tarih ve kültür.',
    longDescription: `İstanbul, iki kıtayı birleştiren eşsiz şehir. Ayasofya, Topkapı Sarayı, Kapalıçarşı ve Boğaz manzarasıyla dünyanın en çok ziyaret edilen kültür rotalarından biridir.`,
    image:
      'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?auto=format&fit=crop&w=2070&q=80',
    location: 'İstanbul, Türkiye',
    bestTimeToVisit: 'Nisan - Haziran, Eylül - Kasım',
    weather: 'Ilıman, nemli',
    transportation: 'İstanbul Havalimanı veya Sabiha Gökçen Havalimanı',
    duration: '3-4 gün',
    highlights: ['Ayasofya', 'Topkapı Sarayı', 'Kapalıçarşı', 'Boğaz Turu'],
    category: 'historical',
    matchKeywords: [
      'istanbul',
      'İstanbul',
      'ayasofya',
      'topkapı',
      'topkapi',
      'kapalıçarşı',
      'kapalicarsi',
      'boğaz',
      'bogaz',
      'tarihi yarımada',
      'sultanahmet',
    ],
  },
];
