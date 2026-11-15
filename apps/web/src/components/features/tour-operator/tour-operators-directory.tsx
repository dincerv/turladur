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

function AgencyCard({ agency }: { agency: MarketplaceAgencyProfile }) {
  const logoUrl = agency.logo
    ? resolveMediaUrl(agency.logo) || agency.logo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.companyName)}&background=171717&color=fff`;
  const rating = Number(agency.averageRating ?? 0);

  return (
    <Link
      href={`/tour-operator/${agency.id}`}
      className="group block h-full rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
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
    <div className="bg-neutral-50 pb-16 pt-10 sm:pt-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Tur Operatörleri
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Acenteler
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
            Onaylı tur operatörlerini keşfedin; her acentenin yayınladığı
            turlara profilinden ulaşın.
          </p>
        </div>

        <div className="relative mt-8 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Acente veya şehir ara…"
            maxLength={80}
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
            aria-label="Acente ara"
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-neutral-600">
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
