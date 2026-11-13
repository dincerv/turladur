'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle as AlertTriangleIcon,
  ArrowRight as ArrowRightIcon,
  Building2 as BuildingOfficeIcon,
  Globe as GlobeAltIcon,
  Heart as HeartIcon,
  Map as MapIcon,
  MapPin as MapPinIcon,
  Mountain as MountainIcon,
  RotateCw as RotateCwIcon,
  Star as StarIcon,
  Users as UserGroupIcon,
} from 'lucide-react';

import { Hero } from '@/components/features/home/hero';
import { RoutesExplorer } from '@/components/features/route/routes-page/routes-explorer';
import { toRouteListItem } from '@/components/features/route/routes-page/routes-explorer.helpers';
import {
  mergeRouteWithOverlay,
  routeOverlaysByKey,
} from '@/lib/route-page-overlay';
import { listRoutePageOverlays } from '@/services/content';
import { listRoutes, type RoutesListResponse } from '@/services/route';

type IconComponent = ComponentType<{ className?: string }>;

/** Tour.category keys — partner Tur Tipi feed. Legacy keys still resolve on API. */
const CATEGORY_ICONS: Record<string, IconComponent> = {
  CULTURAL: GlobeAltIcon,
  NATURE: MapIcon,
  BEACH: HeartIcon,
  GASTRONOMY: MapPinIcon,
  ADVENTURE: MountainIcon,
  CITY: BuildingOfficeIcon,
  historical: GlobeAltIcon,
  nature: MapIcon,
  beach: HeartIcon,
  gastronomy: MapPinIcon,
  family: BuildingOfficeIcon,
};

const FILTER_KEYS = ['search', 'category', 'duration', 'season'] as const;

type LoadState =
  | { status: 'loading'; data: RoutesListResponse | null }
  | { status: 'ready'; data: RoutesListResponse }
  | { status: 'error'; data: RoutesListResponse | null };

function CategoryCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-6"
      aria-hidden
    >
      <div className="mb-5 h-12 w-12 animate-pulse rounded-full bg-neutral-200" />
      <div className="mb-2 h-5 w-1/2 animate-pulse rounded bg-neutral-200" />
      <div className="mb-5 h-4 w-full animate-pulse rounded bg-neutral-100" />
      <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
    </div>
  );
}

export default function RoutesPageClient() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');
  const filterKey = searchParams.toString();
  const [state, setState] = useState<LoadState>({
    status: 'loading',
    data: null,
  });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(filterKey);
    setState((prev) => ({ status: 'loading', data: prev.data }));

    Promise.all([
      listRoutes({
        search: params.get('search') ?? undefined,
        category: params.get('category') ?? undefined,
        duration: params.get('duration') ?? undefined,
        season: params.get('season') ?? undefined,
      }),
      listRoutePageOverlays().catch(() => []),
    ])
      .then(([body, overlays]) => {
        if (cancelled) return;
        const overlayMap = routeOverlaysByKey(overlays);
        setState({
          status: 'ready',
          data: {
            ...body,
            routes: (body.routes ?? []).map((route) =>
              mergeRouteWithOverlay(route, overlayMap.get(route.id)),
            ),
            categories: body.categories ?? [],
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({ status: 'error', data: prev.data }));
      });

    return () => {
      cancelled = true;
    };
  }, [filterKey, reloadToken]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  const data = state.data;
  const items = useMemo(
    () => (data?.routes ?? []).map(toRouteListItem),
    [data],
  );
  const categories = data?.categories ?? [];
  const stats = data?.stats;
  const initialLoading = state.status === 'loading' && data === null;
  const hasActiveFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  return (
    <div className="bg-white text-neutral-800">
      <Hero variant="routes" />

      <section className="border-t border-neutral-100 bg-neutral-50 py-14 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-neutral-950 md:mb-4">
              Rota Kategorileri
            </h2>
            <p className="text-base text-neutral-600 md:text-lg">
              İlgi alanlarınıza göre özenle hazırladığımız rota kategorilerimizi
              keşfedin
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {initialLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <CategoryCardSkeleton key={index} />
                ))
              : categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category.key] ?? MapIcon;
                  const isActive = activeCategory === category.key;
                  return (
                    <Link
                      key={category.key}
                      href={`/routes?category=${encodeURIComponent(category.key)}#popular-routes`}
                      aria-current={isActive ? 'true' : undefined}
                      className={`rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                        isActive
                          ? 'border-neutral-950 ring-1 ring-neutral-950'
                          : 'border-neutral-200'
                      }`}
                    >
                      <div
                        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${category.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 line-clamp-1 text-xl font-semibold text-neutral-950">
                        {category.name}
                      </h3>
                      <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">
                          {category.count} tur
                        </span>
                        <span className="inline-flex items-center text-sm font-semibold text-neutral-950">
                          Keşfet
                          <ArrowRightIcon className="ml-1 h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      <section id="popular-routes" className="scroll-mt-20 py-14 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-neutral-950">
                Popüler Rotalar
              </h2>
              <p className="text-base text-neutral-600 md:text-lg">
                Türkiye&apos;nin en çok tercih edilen destinasyonları ve gezi
                rotaları
              </p>
            </div>
            {hasActiveFilters ? (
              <Link
                href="/routes#popular-routes"
                className="text-sm font-semibold text-neutral-950 underline-offset-2 hover:underline"
              >
                Filtreleri temizle
              </Link>
            ) : null}
          </div>

          {state.status === 'error' ? (
            <div
              role="alert"
              className="mb-6 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 shrink-0" aria-hidden />
                Rotalar şu anda yüklenemedi. Lütfen tekrar deneyin.
              </p>
              <button
                type="button"
                onClick={retry}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-700 px-3 font-semibold text-white transition hover:bg-red-800"
              >
                <RotateCwIcon className="h-4 w-4" aria-hidden />
                Tekrar dene
              </button>
            </div>
          ) : null}

          {state.status === 'ready' && items.length === 0 ? (
            <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
              <p className="mb-4 text-neutral-600">
                Arama kriterlerinize uygun rota bulunamadı.
              </p>
              <Link
                href="/routes#popular-routes"
                className="inline-flex rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Filtreleri temizle
              </Link>
            </div>
          ) : state.status === 'error' && data === null ? null : (
            <RoutesExplorer
              items={items}
              initialLoading={initialLoading}
              refreshing={state.status === 'loading' && data !== null}
            />
          )}
        </div>
      </section>

      {stats ? (
        <section className="bg-neutral-950 py-14 text-white md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
              <h2 className="mb-3 text-3xl font-bold tracking-tight md:mb-4">
                turta Rotalar
              </h2>
              <p className="text-base text-neutral-300 md:text-lg">
                Türkiye&apos;nin en kapsamlı ve detaylı rota arşivi
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {[
                {
                  number: String(stats.routeCount),
                  label: 'Aktif Rota',
                  icon: MapIcon,
                },
                {
                  number: String(stats.operatorCount),
                  label: 'Tur Operatörü',
                  icon: UserGroupIcon,
                },
                {
                  number: String(stats.tourCount),
                  label: 'Tur Seçeneği',
                  icon: HeartIcon,
                },
                {
                  number:
                    typeof stats.avgRating === 'number'
                      ? stats.avgRating.toFixed(1)
                      : '—',
                  label: 'Ortalama Puan',
                  icon: StarIcon,
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mb-4 flex justify-center" aria-hidden>
                    <div className="rounded-full bg-white/10 p-3">
                      <stat.icon className="h-7 w-7" />
                    </div>
                  </div>
                  <p className="mb-1 text-3xl font-bold md:text-4xl">
                    {stat.number}
                  </p>
                  <p className="text-sm text-neutral-400 md:text-base">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
