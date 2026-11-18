'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Globe, MapPin } from 'lucide-react';

import MembershipBadge from '@/components/features/tour/membership-badge';
import StarRating from '@/components/features/tour/star-rating';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import type { MembershipTier } from '@/lib/tours/legacy-tour';
import { ApiError } from '@/services/api-client';
import { searchTours } from '@/services/catalog';
import {
  getMarketplaceAgencyProfile,
  type MarketplaceAgencyProfile,
} from '@/services/marketplace-agency';
import type { Tour } from '@turta/shared-types';

type TourOperatorPublicClientProps = {
  agencyId: string;
};

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80';

function formatPrice(price: string, currency: string) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return `${price} ${currency}`;
  return `${amount.toLocaleString('tr-TR')} ${currency}`;
}

function TourCard({ tour }: { tour: Tour }) {
  const cover =
    resolveMediaUrl(tour.coverUrl) ||
    'https://placehold.co/800x600/e5e7eb/6b7280?text=Tur';
  const rating = Number(tour.averageRating ?? 0);

  return (
    <Link
      href={
        tour.slug
          ? `/tours/${encodeURIComponent(tour.slug)}`
          : `/tours/${encodeURIComponent(tour.id)}`
      }
      className="block h-full focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition hover:border-neutral-300">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={cover}
            alt={tour.title}
            fill
            unoptimized={shouldUnoptimizeMedia(cover)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {tour.partner?.membershipTier ? (
            <div className="absolute left-3 top-3">
              <MembershipBadge
                tier={tour.partner.membershipTier as MembershipTier}
                variant="onImage"
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">
            {tour.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
            <StarRating rating={rating} size="sm" />
            <span>
              {rating > 0 ? rating.toFixed(1) : '—'} ({tour.reviewCount ?? 0})
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between pt-4">
            <p className="text-xs text-neutral-500">
              {tour.durationDays} gün · {tour.category}
            </p>
            <p className="text-base font-bold text-neutral-900">
              {formatPrice(tour.price, tour.currency)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TourOperatorPublicClient({
  agencyId,
}: TourOperatorPublicClientProps) {
  const [profile, setProfile] = useState<MarketplaceAgencyProfile | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [agency, tourResult] = await Promise.all([
          getMarketplaceAgencyProfile(agencyId),
          searchTours({ agencyId, limit: 24, sortBy: 'createdAt' }),
        ]);
        if (cancelled) return;
        setProfile(agency);
        setTours(tourResult.data);
        setTotal(tourResult.meta?.total ?? tourResult.data.length);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : 'Tur operatörü yüklenemedi',
        );
        setProfile(null);
        setTours([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;
    if (window.location.hash === '#tours') {
      const el = document.getElementById('tours');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, tours.length]);

  const logoUrl = useMemo(() => {
    if (!profile?.logo) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.companyName || 'Operator')}&background=171717&color=fff`;
    }
    return resolveMediaUrl(profile.logo) || profile.logo;
  }, [profile]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-neutral-800" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          {error ?? 'Sayfa bulunamadı'}
        </h1>
        <Link
          href="/tour-operator"
          className="mt-4 inline-flex text-sm font-medium text-neutral-700 underline"
        >
          Acentelere dön
        </Link>
      </div>
    );
  }

  const rating = Number(profile.averageRating ?? 0);
  const description =
    profile.description?.trim() ||
    'Tur operatörü hakkında bilgi bulunmamaktadır';

  return (
    <div className="bg-neutral-50 pb-16" data-testid="tour-operator-profile">
      <section className="relative overflow-hidden border-b border-sky-900/10 bg-slate-900 pt-28 pb-12 md:pb-14">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-sky-950/85 via-slate-900/65 to-teal-950/75"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-sky-950/35"
        />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 xl:px-20">
          <Link
            href="/tour-operator"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-100/90 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Acentelere dön
          </Link>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30 bg-neutral-900 sm:h-24 sm:w-24">
              <Image
                src={logoUrl}
                alt={profile.companyName}
                fill
                unoptimized={shouldUnoptimizeMedia(logoUrl)}
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                  {profile.companyName}
                </h1>
                <MembershipBadge
                  tier={profile.membershipTier as MembershipTier}
                  variant="onImage"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-sky-50/90">
                <span className="inline-flex items-center gap-1.5">
                  <StarRating rating={rating} size="sm" />
                  {rating > 0 ? rating.toFixed(1) : '—'} ({profile.reviewCount}{' '}
                  değerlendirme)
                </span>
                {profile.city ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.city}
                    {profile.country ? `, ${profile.country}` : ''}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {profile.publishedTourCount} yayınlı tur
                </span>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-sky-50/80 md:text-base">
                {description}
              </p>
              {profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-200 hover:text-teal-100 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Web sitesi
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div
        id="tours"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Tüm turlar</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {total} yayınlanmış tur listeleniyor
            </p>
          </div>
        </div>

        {tours.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-500">
            Bu operatörün yayınlanmış turu bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
