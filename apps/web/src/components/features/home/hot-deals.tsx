'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, ArrowRight } from 'lucide-react';

import MembershipBadge from '@/components/features/tour/membership-badge';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholder';
import type { MembershipTier } from '@/lib/tours/legacy-tour';
import { searchToursClient } from '@/services/catalog';
import { searchExperiences } from '@/services/activity';

type Deal = {
  id: string;
  title: string;
  description: string;
  salePrice: number;
  originalPrice: number | null;
  image: string | null;
  location: string;
  type: 'tour' | 'activity';
  partnerName: string | null;
  partnerTier: MembershipTier | null;
  operatorRating: number;
  featured: boolean;
  discount?: number;
};

type CategoryTab = 'popular' | 'lastMinute' | 'discount' | 'all';

type CategoryDef = { id: CategoryTab; title: string };

const PLACEHOLDER_IMAGE = IMAGE_PLACEHOLDER;

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

function mapRowToDeal(row: unknown, kind: 'tour' | 'activity'): Deal | null {
  const record = row as Record<string, unknown>;
  const id = record.id;
  if (id == null || id === '') return null;

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

  const tierRaw = String(
    (record.partner as { membershipTier?: string } | undefined)
      ?.membershipTier ??
      record.membershipTier ??
      '',
  ).toUpperCase();
  const partnerTier =
    tierRaw === 'GOLD' || tierRaw === 'SILVER' || tierRaw === 'BRONZE'
      ? (tierRaw as MembershipTier)
      : null;

  return {
    id: String(id),
    title: String(record.title ?? ''),
    description: String(record.description ?? ''),
    salePrice: Number.isFinite(price) ? price : 0,
    originalPrice,
    image: (record.coverUrl as string | null) ?? null,
    location: String(record.location ?? record.city ?? 'Türkiye'),
    type: kind,
    partnerName: null,
    partnerTier,
    operatorRating: Number(record.averageRating ?? 0) || 0,
    featured: Boolean(record.featured),
    discount,
  };
}

async function loadDeals(kind: 'tour' | 'activity'): Promise<Deal[]> {
  try {
    const rows =
      kind === 'tour'
        ? (await searchToursClient({ limit: 12 })).data
        : (await searchExperiences({ limit: 12 })).data;

    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => mapRowToDeal(row, kind))
      .filter((deal): deal is Deal => deal !== null);
  } catch {
    return [];
  }
}

function filterDeals(deals: Deal[], tab: CategoryTab): Deal[] {
  switch (tab) {
    case 'popular':
      return [...deals]
        .sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return b.operatorRating - a.operatorRating;
        })
        .slice(0, 8);
    case 'discount':
      return deals.filter((d) => (d.discount ?? 0) > 0).slice(0, 8);
    case 'lastMinute':
    case 'all':
    default:
      return deals.slice(0, 8);
  }
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
  /** SSR ile gelen turlar — client API hatasında bile kaybolmaz */
  initialTours?: unknown[];
  initialActivities?: unknown[];
};

export function HotDeals({
  initialTours = [],
  initialActivities = [],
}: HotDealsProps) {
  const seedTours = useMemo(
    () =>
      initialTours
        .map((row) => mapRowToDeal(row, 'tour'))
        .filter((d): d is Deal => d !== null),
    [initialTours],
  );
  const seedActivities = useMemo(
    () =>
      initialActivities
        .map((row) => mapRowToDeal(row, 'activity'))
        .filter((d): d is Deal => d !== null),
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

    // SSR veri varsa client refetch atlanır (CLS + boş ekran önlenir)
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
      className="bg-gradient-to-b from-neutral-50 via-white to-neutral-50 py-20 md:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-24">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
              Öne Çıkan Turlar
            </div>
            <h2 className="mb-4 text-3xl font-bold break-words text-neutral-900 md:text-4xl">
              Sizin İçin Seçtiğimiz Turlar
            </h2>
          </div>

          <CategoryTabs
            categories={tourCategories}
            active={activeTourCategory}
            onChange={setActiveTourCategory}
            label="Tur kategorileri"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
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
              Öne Çıkan Aktiviteler
            </div>
            <h2 className="mb-4 text-3xl font-bold break-words text-neutral-900 md:text-4xl">
              Macera Dolu Aktiviteler
            </h2>
          </div>

          <CategoryTabs
            categories={activityCategories}
            active={activeActivityCategory}
            onChange={setActiveActivityCategory}
            label="Aktivite kategorileri"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
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

function DealCard({ deal, index }: { deal: Deal; index: number }) {
  const [imageSrc, setImageSrc] = useState(deal.image || PLACEHOLDER_IMAGE);

  useEffect(() => {
    setImageSrc(deal.image || PLACEHOLDER_IMAGE);
  }, [deal.image]);

  const href =
    deal.type === 'tour' ? `/tours/${deal.id}` : `/activities/${deal.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.06, 0.24), duration: 0.4 }}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
    >
      <Link
        href={href}
        className="relative aspect-[4/3] w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset"
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
            if (imageSrc !== PLACEHOLDER_IMAGE) setImageSrc(PLACEHOLDER_IMAGE);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {deal.partnerTier ? (
          <div className="absolute top-2 left-2">
            <MembershipBadge tier={deal.partnerTier} variant="onImage" />
          </div>
        ) : null}
        {deal.discount && deal.discount > 0 ? (
          <div className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            %{deal.discount} İndirim
          </div>
        ) : null}
      </Link>

      <div className="flex flex-grow flex-col p-4">
        <div className="mb-2 flex min-w-0 items-center gap-3 text-xs text-neutral-500">
          <div className="flex min-w-0 items-center">
            <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <span className="truncate">{deal.location || 'Türkiye'}</span>
          </div>
          <div className="flex shrink-0 items-center">
            <Star className="mr-1 h-3.5 w-3.5 text-amber-400" />
            <span>
              {deal.operatorRating > 0
                ? deal.operatorRating.toFixed(1)
                : 'Yeni'}
            </span>
          </div>
        </div>

        <h3 className="mb-2 line-clamp-2 text-base leading-snug font-semibold break-words text-neutral-800">
          <Link
            href={href}
            className="transition-colors hover:text-neutral-600 focus:outline-none focus-visible:underline"
          >
            {deal.title}
          </Link>
        </h3>

        <p className="mb-3 line-clamp-2 flex-grow text-xs leading-relaxed break-words text-neutral-600">
          {deal.description}
        </p>

        <div className="mt-auto mb-3 border-t border-neutral-100 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-lg font-bold text-neutral-900">
                {formatPrice(deal.salePrice)}
              </span>
              {deal.originalPrice && deal.originalPrice > deal.salePrice ? (
                <span className="shrink-0 text-xs text-neutral-400 line-through">
                  {formatPrice(deal.originalPrice)}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 text-xs text-neutral-500">/ kişi</span>
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
