import type { Campaign } from './campaigns.types';

/**
 * Presentation fixtures for /campaigns UI (not CMS seed).
 * Includes one intentional fake-discount row so the pricing helper can hide it.
 */
export const CAMPAIGN_FIXTURES: readonly Campaign[] = [
  {
    id: '1',
    slug: 'erken-rezervasyon',
    title: 'Erken Rezervasyon İndirimi',
    description:
      'Yaz sezonu için erken planlayanlara şeffaf fiyat avantajı. Koşullar rezervasyon sırasında net gösterilir.',
    terms:
      'En az 60 gün önceden yapılan seçili tur rezervasyonlarında geçerlidir.',
    image:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop',
    category: 'Erken Rezervasyon',
    location: 'Tüm Destinasyonlar',
    salePrice: 11250,
    originalPrice: 15000,
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    label: 'Popüler',
    href: '/tours',
  },
  {
    id: '2',
    slug: 'aile-paketi',
    title: 'Aile Paketi',
    description:
      'Ailelere özel paket koşulları. Ücretsiz çocuk hakkı tur politikasına göre değişir; rezervasyonda netleşir.',
    terms: '0–6 yaş için seçili otel/tur kombinasyonlarında geçerlidir.',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
    category: 'Aile Paketi',
    location: 'Türkiye',
    salePrice: null,
    originalPrice: null,
    endsAt: null,
    label: 'Aile',
    href: '/tours',
  },
  {
    id: '3',
    slug: 'son-dakika',
    title: 'Son Dakika Fırsatı',
    description:
      'Yakın tarihli kalkışlarda kalan kontenjan için güncel fiyat. İndirim oranı listedeki fiyatlardan hesaplanır.',
    terms: 'Kalkışa 14 gün ve daha az kala seçili turlarda geçerlidir.',
    image:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200&auto=format&fit=crop',
    category: 'Son Dakika',
    location: 'Avrupa',
    salePrice: 8900,
    originalPrice: 12700,
    endsAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    label: null,
    href: '/tours',
  },
  {
    id: '4',
    slug: 'uzun-konaklama',
    title: 'Uzun Konaklama İndirimi',
    description:
      '7 gece ve üzeri paketlerde netleştirilmiş fiyat. “Varan” iddiaları yerine gerçek liste fiyatı gösterilir.',
    terms: '7+ gece paketlerde, kampanya bitiş tarihine kadar.',
    image:
      'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?q=80&w=1200&auto=format&fit=crop',
    category: 'Uzun Konaklama',
    location: 'Tüm Destinasyonlar',
    salePrice: 18500,
    originalPrice: 24000,
    endsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    label: null,
    href: '/tours',
  },
  {
    id: '5',
    slug: 'bahar',
    title: 'Bahar Kampanyası',
    description:
      'Bahar dönemi seçili Akdeniz rotalarında güncel fiyat. Karşılaştırma fiyatı yalnızca gerçekten yüksekse gösterilir.',
    terms: 'Belirtilen destinasyon ve tarihler için geçerlidir.',
    image:
      'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1200&auto=format&fit=crop',
    category: 'Mevsimsel',
    location: 'Akdeniz',
    salePrice: 6400,
    originalPrice: 8000,
    endsAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    label: null,
    href: '/tours',
  },
  {
    id: '6',
    slug: 'balayi',
    title: 'Balayı Paketi',
    description:
      'Özel paket ekstraları rezervasyon özetinde listelenir. Fiyat alanı paket içeriğine göre değişebilir.',
    terms: 'Seçili balayı paketlerinde geçerlidir.',
    image:
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200&auto=format&fit=crop',
    category: 'Özel Paket',
    location: 'Maldivler',
    salePrice: 42000,
    originalPrice: 42000, // fake / zero discount — badge must hide
    endsAt: null,
    label: 'Özel',
    href: '/tours',
  },
  {
    id: '7',
    slug: 'expired-demo',
    title: 'Süresi Dolmuş Kampanya',
    description:
      'Bu kayıt sunucu saatiyle filtrelenir; listede görünmemelidir.',
    terms: null,
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    category: 'Demo',
    location: '—',
    salePrice: 5000,
    originalPrice: 7000,
    endsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    label: null,
    href: '/tours',
  },
] as const;
