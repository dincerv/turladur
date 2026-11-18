'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Search } from 'lucide-react';

import MembershipBadge from '@/components/features/tour/membership-badge';
import StarRating from '@/components/features/tour/star-rating';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import type { MembershipTier } from '@/lib/tours/legacy-tour';
import { ApiError } from '@/services/api-client';
import {
  searchMarketplaceAgencies,
  type MarketplaceAgencyProfile,
} from '@/services/marketplace-agency';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80';

function AgencyCard({ agency }: { agency: MarketplaceAgencyProfile }) {
  const logoUrl = agency.logo
    ? resolveMediaUrl(agency.logo) || agency.logo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.companyName)}&background=171717&color=fff`;
  const rating = Number(agency.averageRating ?? 0);
  const description = agency.description?.trim();

  return (
    <Link
      href={`/tour-operator/${agency.id}`}
      className="group block h-full rounded-2xl border border-neutral-200/80 bg-white p-5 transition hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      data-testid={`agency-card-${agency.id}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-900">
          <Image
            src={logoUrl}
            alt={agency.companyName}
            fill
            unoptimized={shouldUnoptimizeMedia(logoUrl)}
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-neutral-900 group-hover:text-neutral-950">
              {agency.companyName}
            </h2>
            <MembershipBadge tier={agency.membershipTier as MembershipTier} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <StarRating rating={rating} size="sm" />
              {rating > 0 ? rating.toFixed(1) : '—'}
              <span className="text-neutral-400">({agency.reviewCount})</span>
            </span>
            {agency.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {agency.city}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {agency.publishedTourCount} tur
            </span>
          </div>
          {description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function TourOperatorsDirectory() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MarketplaceAgencyProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await searchMarketplaceAgencies({
          q: debouncedQ || undefined,
          page,
          limit: 24,
        });
        if (cancelled) return;
        setItems(result.data ?? []);
        const meta = result.meta as
          { total?: number; totalPages?: number } | undefined;
        setTotal(meta?.total ?? result.data?.length ?? 0);
        setTotalPages(meta?.totalPages ?? 1);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'Acenteler yüklenirken bir sorun oluştu',
        );
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, page]);

  const emptyLabel = useMemo(() => {
    if (debouncedQ) return `"${debouncedQ}" için acente bulunamadı.`;
    return 'Henüz listelenecek tur operatörü yok.';
  }, [debouncedQ]);

  return (
    <div className="bg-neutral-50 pb-16" data-testid="tour-operators-directory">
      <section className="relative overflow-hidden border-b border-sky-900/10 bg-slate-900 pt-28 pb-12 md:pb-16">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-sky-950/80 via-teal-900/55 to-slate-900/75"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-sky-950/30"
        />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 xl:px-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-sky-50 shadow-sm backdrop-blur-md">
              <span className="mr-2 h-2 w-2 rounded-full bg-teal-300" />
              Onaylı operatörler
            </div>
            <h1 className="mb-3 text-3xl leading-tight font-bold tracking-tight text-white md:text-5xl">
              Onaylı acenteleri <span className="text-teal-200">keşfet</span>
            </h1>
            <p className="mb-8 text-base text-sky-50/85 md:px-6 md:text-lg">
              Türkiye&apos;nin doğrulanmış tur operatörlerini inceleyin; her
              acentenin yayınladığı turlara profilinden ulaşın.
            </p>

            <div className="relative mx-auto max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Acente veya şehir ara…"
                maxLength={80}
                className="w-full rounded-full border-0 bg-white/95 py-3.5 pl-11 pr-4 text-sm text-neutral-900 shadow-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/60"
                aria-label="Acente ara"
                data-testid="agency-search-input"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 flex items-center justify-between gap-3 text-sm text-neutral-600">
          <p>{loading ? 'Yükleniyor…' : `${total} acente`}</p>
          <Link
            href="/tours"
            className="font-medium text-neutral-900 underline-offset-2 hover:underline"
          >
            Tüm turlara git
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-neutral-200/70"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-500">
            {emptyLabel}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 disabled:opacity-40"
            >
              Önceki
            </button>
            <span className="text-sm text-neutral-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
