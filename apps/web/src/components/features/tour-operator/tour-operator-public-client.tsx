'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  MessageCircle,
} from 'lucide-react';

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
import { tourCategoryLabel } from '@turta/shared-constants';
import type { Tour } from '@turta/shared-types';

type TourOperatorPublicClientProps = {
  agencyId: string;
};

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
      href={`/tours/${tour.id}`}
      className="block h-full focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-gray-200 hover:shadow-lg">
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
              {tour.durationDays} gün · {tourCategoryLabel(tour.category)}
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
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.companyName || 'Operator')}&background=0EA5E9&color=fff`;
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
          href="/tours"
          className="mt-4 inline-flex text-sm font-medium text-neutral-700 underline"
        >
          Turlara dön
        </Link>
      </div>
    );
  }

  const rating = Number(profile.averageRating ?? 0);

  return (
    <div className="bg-neutral-50 pb-16">
      <div className="border-b border-neutral-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8">
          <Link
            href="/tours"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Turlara dön
          </Link>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sky-500">
                <Image
                  src={logoUrl}
                  alt={profile.companyName}
                  fill
                  unoptimized={shouldUnoptimizeMedia(logoUrl)}
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {profile.companyName}
                  </h1>
                  <MembershipBadge
                    tier={profile.membershipTier as MembershipTier}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-1">
                    <StarRating rating={rating} size="sm" />
                    {rating > 0 ? rating.toFixed(1) : '—'} (
                    {profile.reviewCount} değerlendirme)
                  </span>
                  {profile.city ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.city}
                      {profile.country ? `, ${profile.country}` : ''}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {profile.publishedTourCount} yayınlı tur
                  </span>
                </div>
                <p className="mt-3 text-sm text-neutral-600">
                  {profile.description?.trim() ||
                    'Tur operatörü hakkında bilgi bulunmamaktadır'}
                </p>
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Web sitesi
                  </a>
                ) : null}
              </div>
              <div className="hidden items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 sm:inline-flex">
                <MessageCircle className="h-4 w-4" />
                Tur Operatörü
              </div>
            </div>
          </div>
        </div>
      </div>

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
