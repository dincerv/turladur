'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock3, MapPin, Star, ArrowRight, Store } from 'lucide-react';

import { CompactCompareButton } from '@/components/features/tour/compare/compact-compare-button';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholder';
import { searchToursClient } from '@/services/catalog';
import { searchExperiences } from '@/services/activity';

type TravelerBadge = 'free_cancel' | 'popular' | null;

type Deal = {
  id: string;
  slug?: string | null;
  title: string;
  /** Dedup anahtarı — aynı rota / aktivite başlığı */
  routeKey: string;
  description: string;
  salePrice: number;
  originalPrice: number | null;
  image: string | null;
  location: string;
  /** Kalkış şehri etiketi — tur kartlarında “Ankara Çıkışlı” */
  departureLabel: string | null;
  type: 'tour' | 'activity';
  partnerName: string | null;
  operatorRating: number;
  featured: boolean;
  discount?: number;
  durationLabel: string | null;
  travelerBadge: TravelerBadge;
};

type CategoryTab = 'popular' | 'lastMinute' | 'discount' | 'all';
type CategoryDef = { id: CategoryTab; title: string };

const PLACEHOLDER_IMAGE = IMAGE_PLACEHOLDER;

const TEST_TOUR_RE =
  /\b(e2e|rota\s*harita|gorsel\s*test|görsel\s*test|local\s*\d{8,})\b/i;
const TEST_SLUG_RE = /(e2e|rota-harita|gorsel-test|görsel-test|local-\d{8,})/i;

const CITY_FROM_TITLE: Array<{ city: string; match: RegExp }> = [
  {
    city: 'Nevşehir',
    match: /kapadokya|göreme|nevşehir|uçhisar|ürgüp|soğanlı/i,
  },
  { city: 'Beypazarı', match: /beypazarı|beypazari/i },
  { city: 'Bolu', match: /abant|yedigöller|yedigoller|bolu/i },
  { city: 'Bartın', match: /amasra|safranbolu|bartın|bartin/i },
  {
    city: 'Mardin',
    match: /gap|mardin|göbeklitepe|halfeti|mezopotamya|şanlıurfa|urfa/i,
  },
  { city: 'Şereflikoçhisar', match: /tuz\s*göl/i },
  { city: 'Kastamonu', match: /ilgaz/i },
  {
    city: 'Antalya',
    match: /likya|antalya|kaş|patara|kekova|kalkan|fethiye|ölüdeniz/i,
  },
  {
    city: 'Trabzon',
    match: /karadeniz|trabzon|ayder|uzungöl|pokut|sümela|yayla/i,
  },
  { city: 'İzmir', match: /ege|izmir|urla|çeşme|foça/i },
  { city: 'İstanbul', match: /istanbul|boğaz|sultanahmet|kapalıçarşı/i },
  { city: 'Ankara', match: /eymir|gordion|kızılcahamam|polatlı|ankara/i },
  { city: 'Fethiye', match: /fethiye|ölüdeniz|babadağ/i },
  { city: 'Avanos', match: /avanos|çömlek/i },
  { city: 'Kaş', match: /\bkaş\b/i },
  { city: 'Urla', match: /\burla\b/i },
  { city: 'Göreme', match: /göreme|balon/i },
];

const tourCategories: CategoryDef[] = [
  { id: 'all', title: 'Tüm Turlar' },
  { id: 'popular', title: 'En Popüler' },
  { id: 'discount', title: 'İndirimli' },
];

const activityCategories: CategoryDef[] = [
  { id: 'all', title: 'Tüm Aktiviteler' },
  { id: 'popular', title: 'En Popüler' },
  { id: 'discount', title: 'İndirimli' },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(price);
}

/** "Başlık — Acente Adı" → temiz başlık + acente */
export function splitTitleAgency(raw: string): {
  title: string;
  agencyFromTitle: string | null;
} {
  const text = String(raw ?? '').trim();
  const parts = text.split(/\s+[—–-]\s+/);
  if (parts.length >= 2) {
    const agency = parts[parts.length - 1]?.trim() || null;
    const title = parts.slice(0, -1).join(' — ').trim();
    if (title && agency) return { title, agencyFromTitle: agency };
  }
  return { title: text, agencyFromTitle: null };
}

export function isTestShowcaseItem(title: string, slug?: string | null) {
  if (TEST_TOUR_RE.test(title)) return true;
  if (slug && TEST_SLUG_RE.test(slug)) return true;
  return false;
}

/** 4 sütunlu grid: yarım satır yok — 0, 4 veya 8 (tercihen 8). */
export function fitShowcaseCount(count: number, cols = 4, prefer = 8): number {
  if (count <= 0) return 0;
  if (count >= prefer) return prefer;
  if (count >= cols) return cols;
  return 0;
}

/** Aynı rota / aktivite için tek kart — başlık normalize. */
export function routeDedupeKey(title: string): string {
  const { title: clean } = splitTitleAgency(title);
  return clean
    .toLocaleLowerCase('tr-TR')
    .replace(/[&/+,._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCityFromText(
  ...parts: Array<string | null | undefined>
): string | null {
  const hay = parts.filter(Boolean).join(' ');
  if (!hay.trim()) return null;
  for (const row of CITY_FROM_TITLE) {
    if (row.match.test(hay)) return row.city;
  }
  return null;
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !/^türkiye$/i.test(trimmed) && !/^turkey$/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

function resolveTourLocation(
  record: Record<string, unknown>,
  title: string,
): string {
  const extras =
    record.extras &&
    typeof record.extras === 'object' &&
    !Array.isArray(record.extras)
      ? (record.extras as Record<string, unknown>)
      : {};
  const departureCities = Array.isArray(record.departureCities)
    ? (record.departureCities as unknown[])
    : Array.isArray(extras.departureCity)
      ? (extras.departureCity as unknown[])
      : [];
  const departure =
    typeof departureCities[0] === 'string' ? departureCities[0] : null;

  const destinations = Array.isArray(extras.destinations)
    ? (extras.destinations as Array<Record<string, unknown>>)
    : [];
  const destCity =
    typeof destinations[0]?.city === 'string' ? destinations[0].city : null;

  const region =
    (typeof record.region === 'string' && record.region) ||
    (typeof extras.region === 'string' && extras.region) ||
    null;

  // Kart konum satırında varış/destinasyon; kalkış ayrı “Ankara Çıkışlı” rozeti.
  return (
    firstNonEmpty(
      destCity,
      region,
      typeof record.city === 'string' ? record.city : null,
      typeof record.location === 'string' ? record.location : null,
      inferCityFromText(title, String(record.slug ?? '')),
      departure,
    ) ?? 'Türkiye'
  );
}

function resolveDepartureLabel(record: Record<string, unknown>): string {
  const extras =
    record.extras &&
    typeof record.extras === 'object' &&
    !Array.isArray(record.extras)
      ? (record.extras as Record<string, unknown>)
      : {};
  const departureCities = Array.isArray(record.departureCities)
    ? (record.departureCities as unknown[])
    : Array.isArray(extras.departureCity)
      ? (extras.departureCity as unknown[])
      : [];
  const departure =
    typeof departureCities[0] === 'string' ? departureCities[0] : null;
  const origin =
    typeof extras.originCity === 'string' ? extras.originCity : null;
  return firstNonEmpty(departure, origin) ?? 'Ankara';
}

function resolveActivityLocation(
  record: Record<string, unknown>,
  title: string,
): string {
  return (
    firstNonEmpty(
      typeof record.location === 'string' ? record.location : null,
      typeof record.city === 'string' ? record.city : null,
      inferCityFromText(title),
    ) ?? 'Türkiye'
  );
}

function resolveTravelerBadge(record: Record<string, unknown>): TravelerBadge {
  const extras =
    record.extras &&
    typeof record.extras === 'object' &&
    !Array.isArray(record.extras)
      ? (record.extras as Record<string, unknown>)
      : {};
  const policy = String(
    extras.cancellationPolicy ?? record.cancellationPolicy ?? '',
  );
  if (/ücretsiz\s*iptal/i.test(policy)) return 'free_cancel';

  const featured = Boolean(record.featured);
  const rating = Number(record.averageRating ?? 0) || 0;
  const reviews = Number(record.reviewCount ?? 0) || 0;
  if (featured || (rating >= 4.2 && reviews >= 2)) return 'popular';
  return null;
}

type ShowcaseRow = {
  title?: string | null;
  slug?: string | null;
  location?: string | null;
  city?: string | null;
  departureCities?: string[] | null;
  extras?: unknown;
  featured?: boolean | null;
  averageRating?: string | number | null;
};

/**
 * Vitrin: test kayıtlarını ele, aynı rota/başlıktan en fazla 1 kart,
 * mümkün olduğunca farklı destinasyonlar.
 */
export function pickShowcaseTours<T extends ShowcaseRow>(
  rows: T[],
  limit = 8,
): T[] {
  const clean = rows.filter((row) => {
    const title = String(row.title ?? '');
    const slug = typeof row.slug === 'string' ? row.slug : null;
    return !isTestShowcaseItem(title, slug);
  });

  const byRoute = new Map<string, T>();
  for (const row of clean) {
    const key = routeDedupeKey(String(row.title ?? ''));
    if (!key || byRoute.has(key)) continue;
    byRoute.set(key, row);
  }

  const unique = [...byRoute.values()];
  const picked: T[] = [];
  const seenCity = new Set<string>();
  const rest: T[] = [];

  for (const row of unique) {
    const title = String(row.title ?? '');
    const loc = resolveTourLocation(
      row as unknown as Record<string, unknown>,
      title,
    );
    const cityKey = loc.toLocaleLowerCase('tr-TR');
    if (!seenCity.has(cityKey)) {
      seenCity.add(cityKey);
      picked.push(row);
    } else {
      rest.push(row);
    }
  }

  for (const row of rest) {
    if (picked.length >= Math.max(limit, 8)) break;
    picked.push(row);
  }

  const fitted = fitShowcaseCount(picked.length, 4, limit);
  return picked.slice(0, fitted);
}

export function pickShowcaseActivities<T extends ShowcaseRow>(
  rows: T[],
  limit = 8,
): T[] {
  const clean = rows.filter((row) => {
    const title = String(row.title ?? '');
    const slug = typeof row.slug === 'string' ? row.slug : null;
    return !isTestShowcaseItem(title, slug);
  });

  const byRoute = new Map<string, T>();
  for (const row of clean) {
    const key = routeDedupeKey(String(row.title ?? ''));
    if (!key || byRoute.has(key)) continue;
    byRoute.set(key, row);
  }

  const unique = [...byRoute.values()];
  const byLocation = new Map<string, T>();
  const overflow: T[] = [];
  for (const row of unique) {
    const title = String(row.title ?? '');
    const loc = resolveActivityLocation(
      row as unknown as Record<string, unknown>,
      title,
    ).toLocaleLowerCase('tr-TR');
    if (!byLocation.has(loc)) byLocation.set(loc, row);
    else overflow.push(row);
  }

  const merged = [...byLocation.values(), ...overflow];
  const fitted = fitShowcaseCount(merged.length, 4, limit);
  return merged.slice(0, fitted);
}

function mapRowToDeal(row: unknown, kind: 'tour' | 'activity'): Deal | null {
  const record = row as Record<string, unknown>;
  const id = record.id;
  if (id == null || id === '') return null;

  const rawTitle = String(record.title ?? '');
  const slug = typeof record.slug === 'string' ? record.slug : null;
  if (isTestShowcaseItem(rawTitle, slug)) return null;

  const { title: cleanTitle, agencyFromTitle } = splitTitleAgency(rawTitle);
  const title = cleanTitle || rawTitle;
  const routeKey = routeDedupeKey(title);

  const price = Number(record.price ?? record.salePrice ?? 0);
  const originalRaw = record.originalPrice ?? record.compareAtPrice;
  const originalPrice =
    originalRaw != null && Number(originalRaw) > price
      ? Number(originalRaw)
      : null;
  const discount =
    originalPrice && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;

  const partnerObj = record.partner as { companyName?: string } | undefined;
  const partnerName =
    (typeof record.partnerName === 'string' && record.partnerName.trim()) ||
    (typeof partnerObj?.companyName === 'string' &&
      partnerObj.companyName.trim()) ||
    agencyFromTitle ||
    null;

  let durationLabel: string | null = null;
  if (kind === 'tour') {
    const days = Number(record.durationDays ?? record.duration ?? 0);
    if (Number.isFinite(days) && days > 0) {
      durationLabel = days === 1 ? '1 Gün' : `${Math.round(days)} Gün`;
    }
  } else {
    const dur = String(record.duration ?? '').trim();
    durationLabel = dur || null;
  }

  const location =
    kind === 'tour'
      ? resolveTourLocation(record, title)
      : resolveActivityLocation(record, title);
  const departureLabel =
    kind === 'tour' ? `${resolveDepartureLabel(record)} Çıkışlı` : null;

  return {
    id: String(id),
    slug,
    title,
    routeKey,
    description: String(record.description ?? ''),
    salePrice: Number.isFinite(price) ? price : 0,
    originalPrice,
    image:
      (record.coverUrl as string | null) ??
      (record.imageUrl as string | null) ??
      null,
    location,
    departureLabel,
    type: kind,
    partnerName,
    operatorRating: Number(record.averageRating ?? 0) || 0,
    featured: Boolean(record.featured),
    discount,
    durationLabel,
    travelerBadge: kind === 'tour' ? resolveTravelerBadge(record) : null,
  };
}

/** Aynı routeKey'li kartlardan yalnızca birini tut. */
function dedupeDeals(deals: Deal[]): Deal[] {
  const seen = new Set<string>();
  const out: Deal[] = [];
  for (const deal of deals) {
    const key = deal.routeKey || deal.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(deal);
  }
  return out;
}

async function loadDeals(kind: 'tour' | 'activity'): Promise<Deal[]> {
  try {
    const rows =
      kind === 'tour'
        ? pickShowcaseTours(
            (await searchToursClient({ limit: 48, sortBy: 'rating' })).data ??
              [],
            12,
          )
        : pickShowcaseActivities(
            (await searchExperiences({ limit: 48 })).data ?? [],
            12,
          );

    const list = Array.isArray(rows) ? rows : [];
    return dedupeDeals(
      list
        .map((row) => mapRowToDeal(row, kind))
        .filter((deal): deal is Deal => deal !== null),
    );
  } catch {
    return [];
  }
}

function filterDeals(deals: Deal[], tab: CategoryTab): Deal[] {
  const unique = dedupeDeals(deals);
  let list: Deal[];
  switch (tab) {
    case 'popular':
      list = [...unique].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.operatorRating - a.operatorRating;
      });
      break;
    case 'discount':
      list = unique.filter((d) => (d.discount ?? 0) > 0);
      break;
    case 'lastMinute':
    case 'all':
    default:
      list = unique;
      break;
  }
  const fitted = fitShowcaseCount(list.length, 4, 8);
  return list.slice(0, fitted);
}

function CategoryTabs({
  categories,
  active,
  onChange,
  label,
}: {
  categories: CategoryDef[];
  active: CategoryTab;
  onChange: (id: CategoryTab) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-10 flex flex-wrap justify-center gap-2"
    >
      {categories.map((category) => {
        const isActive = active === category.id;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category.id)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-neutral-950 text-white shadow-md shadow-neutral-200'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {category.title}
          </button>
        );
      })}
    </div>
  );
}

type HotDealsProps = {
  initialTours?: unknown[];
  initialActivities?: unknown[];
};

export function HotDeals({
  initialTours = [],
  initialActivities = [],
}: HotDealsProps) {
  const seedTours = useMemo(
    () =>
      dedupeDeals(
        initialTours
          .map((row) => mapRowToDeal(row, 'tour'))
          .filter((d): d is Deal => d !== null),
      ),
    [initialTours],
  );
  const seedActivities = useMemo(
    () =>
      dedupeDeals(
        initialActivities
          .map((row) => mapRowToDeal(row, 'activity'))
          .filter((d): d is Deal => d !== null),
      ),
    [initialActivities],
  );

  const [activeTourCategory, setActiveTourCategory] =
    useState<CategoryTab>('all');
  const [activeActivityCategory, setActiveActivityCategory] =
    useState<CategoryTab>('all');
  const [tours, setTours] = useState<Deal[]>(seedTours);
  const [activities, setActivities] = useState<Deal[]>(seedActivities);
  const [loadingTours, setLoadingTours] = useState(seedTours.length === 0);
  const [loadingActivities, setLoadingActivities] = useState(
    seedActivities.length === 0,
  );
  const sectionRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (seedTours.length === 0) {
      void loadDeals('tour')
        .then(setTours)
        .finally(() => setLoadingTours(false));
    } else {
      setLoadingTours(false);
    }

    if (seedActivities.length === 0) {
      void loadDeals('activity')
        .then(setActivities)
        .finally(() => setLoadingActivities(false));
    } else {
      setLoadingActivities(false);
    }
  }, [seedTours.length, seedActivities.length]);

  const visibleTours = useMemo(
    () => filterDeals(tours, activeTourCategory),
    [tours, activeTourCategory],
  );
  const visibleActivities = useMemo(
    () => filterDeals(activities, activeActivityCategory),
    [activities, activeActivityCategory],
  );

  return (
    <section
      ref={sectionRef}
      data-testid="home-hot-deals"
      className="scroll-mt-24 bg-gradient-to-b from-neutral-50 via-white to-neutral-50 py-20 md:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-24">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
              Ankara Çıkışlı Turlar
            </div>
            <h2
              data-testid="home-tours-heading"
              className="mb-4 text-3xl font-bold break-words text-neutral-900 md:text-4xl"
            >
              Sizin İçin Seçtiğimiz Turlar
            </h2>
          </div>

          <CategoryTabs
            categories={tourCategories}
            active={activeTourCategory}
            onChange={setActiveTourCategory}
            label="Tur kategorileri"
          />

          <div
            data-testid="home-tour-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
          >
            {loadingTours ? (
              Array.from({ length: 4 }).map((_, i) => (
                <DealCardSkeleton key={i} />
              ))
            ) : visibleTours.length > 0 ? (
              visibleTours.map((deal, index) => (
                <DealCard key={deal.id} deal={deal} index={index} />
              ))
            ) : (
              <p className="col-span-full py-8 text-center text-sm text-neutral-500">
                Bu kategoride şu anda tur bulunmuyor.
              </p>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/tours"
              className="inline-flex items-center rounded-lg bg-neutral-950 px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-neutral-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              Tüm Turları Görüntüle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
              Ankara & Yakın Çevre
            </div>
            <h2 className="mb-4 text-3xl font-bold break-words text-neutral-900 md:text-4xl">
              Günübirlik Deneyimler
            </h2>
          </div>

          <CategoryTabs
            categories={activityCategories}
            active={activeActivityCategory}
            onChange={setActiveActivityCategory}
            label="Aktivite kategorileri"
          />

          <div
            data-testid="home-activity-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
          >
            {loadingActivities ? (
              Array.from({ length: 4 }).map((_, i) => (
                <DealCardSkeleton key={i} />
              ))
            ) : visibleActivities.length > 0 ? (
              visibleActivities.map((deal, index) => (
                <DealCard key={deal.id} deal={deal} index={index} />
              ))
            ) : (
              <p className="col-span-full py-8 text-center text-sm text-neutral-500">
                Bu kategoride şu anda aktivite bulunmuyor.
              </p>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/activities"
              className="inline-flex items-center rounded-lg bg-neutral-950 px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-neutral-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              Tüm Aktiviteleri Görüntüle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TravelerBadgePill({ badge }: { badge: TravelerBadge }) {
  if (!badge) return null;
  const label = badge === 'free_cancel' ? 'Ücretsiz İptal' : 'Popüler';
  const className =
    badge === 'free_cancel'
      ? 'bg-emerald-600 text-white'
      : 'bg-sky-600 text-white';
  return (
    <div
      data-testid="home-card-traveler-badge"
      data-badge={badge}
      className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${className}`}
    >
      {label}
    </div>
  );
}

function DealCard({ deal, index }: { deal: Deal; index: number }) {
  const [imageSrc, setImageSrc] = useState(deal.image || PLACEHOLDER_IMAGE);

  useEffect(() => {
    setImageSrc(deal.image || PLACEHOLDER_IMAGE);
  }, [deal.image]);

  const href =
    deal.type === 'tour'
      ? deal.slug
        ? `/tours/${encodeURIComponent(deal.slug)}`
        : `/tours/${encodeURIComponent(deal.id)}`
      : `/activities/${encodeURIComponent(deal.id)}`;

  const priceLabel = formatPrice(deal.salePrice);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.06, 0.24), duration: 0.4 }}
      data-testid={
        deal.type === 'tour' ? 'home-tour-card' : 'home-activity-card'
      }
      data-route-key={deal.routeKey}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Link
          href={href}
          className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset"
          aria-label={deal.title}
        >
          <Image
            src={imageSrc}
            alt=""
            fill
            priority={index < 2}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={imageSrc.startsWith('data:')}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => {
              if (imageSrc !== PLACEHOLDER_IMAGE)
                setImageSrc(PLACEHOLDER_IMAGE);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        <TravelerBadgePill badge={deal.travelerBadge} />

        {deal.discount && deal.discount > 0 && !deal.travelerBadge ? (
          <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            %{deal.discount} İndirim
          </div>
        ) : null}

        {deal.type === 'tour' ? (
          <div className="absolute bottom-2 right-2 z-10 max-w-[55%]">
            <CompactCompareButton
              tour={{
                id: deal.id,
                title: deal.title,
                coverUrl: deal.image,
                priceLabel,
              }}
              addLabel="+ Kıyasla"
              selectedLabel="Seçildi"
              testId={`home-compare-${deal.id}`}
              className="!bg-white/95 backdrop-blur-sm shadow-sm"
            />
          </div>
        ) : null}

        {deal.durationLabel ? (
          <div
            data-testid="home-card-duration"
            className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-neutral-800 shadow-sm backdrop-blur-sm"
          >
            <Clock3 className="h-3 w-3 text-neutral-500" aria-hidden />
            {deal.durationLabel}
          </div>
        ) : null}
      </div>

      <div className="relative z-0 flex flex-grow flex-col p-4">
        <div
          data-testid="home-card-location"
          className="mb-1.5 flex min-w-0 items-center text-xs text-neutral-500"
        >
          <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <span className="truncate">{deal.location}</span>
        </div>

        <h3 className="mb-1 line-clamp-2 pr-1 text-base leading-snug font-semibold break-words text-neutral-800">
          <Link
            href={href}
            className="transition-colors hover:text-neutral-600 focus:outline-none focus-visible:underline"
          >
            {deal.title}
          </Link>
        </h3>

        {deal.departureLabel ? (
          <p
            data-testid="home-card-departure"
            className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-800"
          >
            {deal.departureLabel}
          </p>
        ) : null}

        {deal.partnerName ? (
          <p
            data-testid="home-card-agency"
            className="mb-2 flex min-w-0 items-center gap-1.5 text-xs font-medium text-neutral-600"
          >
            <Store
              className="h-3.5 w-3.5 shrink-0 text-neutral-400"
              aria-hidden
            />
            <span className="truncate">{deal.partnerName}</span>
          </p>
        ) : null}

        <p className="mb-3 line-clamp-2 flex-grow text-xs leading-relaxed break-words text-neutral-600">
          {deal.description}
        </p>

        <div className="mt-auto mb-3 border-t border-neutral-100 pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-lg font-bold text-neutral-900">
                  {priceLabel}
                </span>
                {deal.originalPrice && deal.originalPrice > deal.salePrice ? (
                  <span className="shrink-0 text-xs text-neutral-400 line-through">
                    {formatPrice(deal.originalPrice)}
                  </span>
                ) : null}
                <span className="shrink-0 text-xs text-neutral-500">
                  / kişi
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-xs text-neutral-500">
              <Star className="h-3.5 w-3.5 text-amber-400" aria-hidden />
              <span>
                {deal.operatorRating > 0
                  ? deal.operatorRating.toFixed(1)
                  : 'Yeni'}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={href}
          className="block w-full rounded-lg bg-neutral-950 px-3 py-2 text-center text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          Detayları Gör
        </Link>
      </div>
    </motion.article>
  );
}

function DealCardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm"
      aria-hidden
    >
      <div className="aspect-[4/3] w-full bg-neutral-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 rounded bg-neutral-200" />
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-2/3 rounded bg-neutral-100" />
        <div className="h-9 w-full rounded-lg bg-neutral-200" />
      </div>
    </div>
  );
}

export default HotDeals;
