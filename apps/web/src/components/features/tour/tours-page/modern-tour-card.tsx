'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { LegacyTourCard as Tour } from '@/lib/tours/legacy-tour';
import MembershipBadge from '@/components/features/tour/membership-badge';
import StarRating from '@/components/features/tour/star-rating';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { Calendar, Clock, Heart, Zap, ArrowRight } from 'lucide-react';
import { formatDepartureCityLabel, formatPrice } from './tours-page.helpers';
import { parseJsonString } from '@/lib/tours/parse';
import type { TourDateWithPromotions } from './tours-page.types';
import { useFavorites } from '@/hooks/use-favorites';

const PLACEHOLDER = 'https://placehold.co/800x600/e5e7eb/6b7280?text=Tur';

type TourBadge = {
  text: string;
  icon: typeof Zap;
  color: string;
};

function resolvePricing(tour: Tour) {
  const price = Number(tour.price) || 0;
  let discountedPrice = price;
  let appliedDiscount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tourDates = (tour.tourDates ?? []) as TourDateWithPromotions[];

  for (const tourDate of tourDates) {
    if (tourDate.earlyBirdDiscount && tourDate.earlyBirdDiscount > 0) {
      const start = tourDate.earlyBirdDeadlineStart
        ? new Date(tourDate.earlyBirdDeadlineStart)
        : null;
      const end = tourDate.earlyBirdDeadline
        ? new Date(tourDate.earlyBirdDeadline)
        : null;
      const base = tourDate.price;
      if (base != null && start && end && today >= start && today <= end) {
        const amount = base * (tourDate.earlyBirdDiscount / 100);
        if (amount > appliedDiscount) {
          appliedDiscount = amount;
          discountedPrice = base - amount;
        }
      }
    }

    if (tourDate.lastMinuteDiscount && tourDate.lastMinuteDiscount > 0) {
      const start = tourDate.lastMinuteStart
        ? new Date(tourDate.lastMinuteStart)
        : null;
      const end = tourDate.lastMinuteStartEnd
        ? new Date(tourDate.lastMinuteStartEnd)
        : null;
      const base = tourDate.price;
      if (base != null && start && end && today >= start && today <= end) {
        const amount = base * (tourDate.lastMinuteDiscount / 100);
        if (amount > appliedDiscount) {
          appliedDiscount = amount;
          discountedPrice = base - amount;
        }
      }
    }
  }

  if (appliedDiscount === 0 && tour.discount && tour.discount > 0) {
    discountedPrice = price * (1 - tour.discount / 100);
  }

  return { price, discountedPrice, appliedDiscount, tourDates };
}

function resolveBadge(
  tour: Tour,
  tourDates: TourDateWithPromotions[],
): TourBadge | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const tourDate of tourDates) {
    if (tourDate.earlyBirdDiscount && tourDate.earlyBirdDiscount > 0) {
      const start = tourDate.earlyBirdDeadlineStart
        ? new Date(tourDate.earlyBirdDeadlineStart)
        : null;
      const end = tourDate.earlyBirdDeadline
        ? new Date(tourDate.earlyBirdDeadline)
        : null;
      if (start && end && today >= start && today <= end) {
        return {
          text: `%${tourDate.earlyBirdDiscount} Erken Rezervasyon`,
          icon: Zap,
          color: 'bg-emerald-500',
        };
      }
    }
    if (tourDate.lastMinuteDiscount && tourDate.lastMinuteDiscount > 0) {
      const start = tourDate.lastMinuteStart
        ? new Date(tourDate.lastMinuteStart)
        : null;
      const end = tourDate.lastMinuteStartEnd
        ? new Date(tourDate.lastMinuteStartEnd)
        : null;
      if (start && end && today >= start && today <= end) {
        return {
          text: `%${tourDate.lastMinuteDiscount} Son Dakika`,
          icon: Clock,
          color: 'bg-orange-500',
        };
      }
    }
  }

  if (tour.discount && tour.discount > 0) {
    return {
      text: `%${tour.discount} İndirim`,
      icon: Zap,
      color: 'bg-red-500',
    };
  }
  if (tour.isLastMinute) {
    return { text: 'Son Dakika', icon: Clock, color: 'bg-orange-500' };
  }
  if (tour.isEarlyBird) {
    return { text: 'Erken Rezervasyon', icon: Zap, color: 'bg-emerald-500' };
  }
  return null;
}

export function ModernTourCard({
  tour,
  priority = false,
  layout = 'grid',
}: {
  tour: Tour;
  priority?: boolean;
  layout?: 'grid' | 'list';
}) {
  const { isTourFavorite, toggleTourFavorite, isMutating } = useFavorites();
  const isFavorite = isTourFavorite(tour.id);
  const isList = layout === 'list';

  const { price, discountedPrice, appliedDiscount, tourDates } =
    resolvePricing(tour);
  const badge = resolveBadge(tour, tourDates);
  const departureText = formatDepartureCityLabel(tour.departureCity);
  const tourImages = parseJsonString<string[]>(tour.images || '[]', []);
  const coverSrc = resolveMediaUrl(tourImages[0]) || PLACEHOLDER;
  const reviewCount = tour.reviewCount ?? 0;
  const averageRating = tour.rating ?? 0;
  const remainingSpots = tour.maxParticipants || 0;
  const companyName = tour.tourOperator?.companyName || 'Partner';
  const firstDate = tourDates[0];
  const tourDateText =
    firstDate?.startDate && firstDate?.endDate
      ? `${format(new Date(firstDate.startDate), 'd MMMM', { locale: tr })} - ${format(new Date(firstDate.endDate), 'd MMMM yyyy', { locale: tr })}`
      : `${tour.duration || 1} Gün`;
  const otherDatesCount = Math.max(tourDates.length - 1, 0);
  const title = (tour.name || 'Tur').trim() || 'Tur';

  return (
    <article className="h-full">
      <Link
        href={`/tours/${tour.id}`}
        className={`group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 ${
          isList ? 'flex h-full flex-col sm:flex-row' : 'flex h-full flex-col'
        }`}
        aria-label={title}
      >
        <div
          className={`relative overflow-hidden bg-neutral-100 ${
            isList
              ? 'aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-56 md:w-64'
              : 'aspect-[4/3] w-full'
          }`}
        >
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes={
              isList
                ? '(max-width: 640px) 100vw, 256px'
                : '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw'
            }
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            unoptimized={shouldUnoptimizeMedia(coverSrc)}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {badge ? (
            <div
              className={`absolute top-3 left-3 flex max-w-[70%] items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${badge.color}`}
            >
              <badge.icon className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{badge.text}</span>
            </div>
          ) : null}

          <div className={`absolute left-3 ${badge ? 'top-11' : 'top-3'}`}>
            <MembershipBadge
              tier={tour.tourOperator?.membershipTier}
              variant="onImage"
            />
          </div>

          <button
            type="button"
            aria-label={isFavorite ? 'Favorilerden kaldır' : 'Favorilere ekle'}
            disabled={isMutating}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void toggleTourFavorite(tour.id, `/tours/${tour.id}`);
            }}
            className={`absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-sm transition-colors hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:opacity-60 ${
              isFavorite ? 'text-red-500' : ''
            }`}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`}
              aria-hidden
            />
          </button>

          {departureText ? (
            <div className="absolute bottom-3 left-3 max-w-[calc(100%-3.5rem)] rounded-lg bg-neutral-950/65 px-2 py-1 backdrop-blur-sm">
              <span className="block truncate text-xs font-medium text-white">
                {departureText}
              </span>
            </div>
          ) : null}

          <div className="absolute right-3 bottom-3">
            <div className="relative">
              <div className="h-7 w-7 overflow-hidden rounded-full border border-white shadow-sm">
                <Image
                  src={
                    resolveMediaUrl(tour.tourOperator?.logo) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=0EA5E9&color=fff`
                  }
                  alt=""
                  width={28}
                  height={28}
                  unoptimized={shouldUnoptimizeMedia(
                    resolveMediaUrl(tour.tourOperator?.logo),
                  )}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pointer-events-none absolute right-0 bottom-full z-10 mb-2 max-w-[12rem] truncate rounded-lg bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {companyName}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-base leading-tight font-semibold break-words text-neutral-900 transition-colors group-hover:text-neutral-700">
            {title}
          </h3>

          <div className="mb-3 flex min-h-[1.25rem] items-center gap-1 text-neutral-600">
            <Calendar
              className="h-3 w-3 shrink-0 text-neutral-400"
              aria-hidden
            />
            <span className="truncate text-xs">{tourDateText}</span>
          </div>

          <div className="mb-3 flex min-h-[1.5rem] items-center gap-2">
            {reviewCount > 0 ? (
              <>
                <StarRating rating={averageRating} size="sm" />
                <span className="whitespace-nowrap text-xs text-neutral-500">
                  {averageRating.toFixed(1)} ({reviewCount})
                </span>
              </>
            ) : (
              <span className="text-xs text-neutral-400">
                Henüz değerlendirme yok
              </span>
            )}
            {remainingSpots > 0 && remainingSpots <= 5 ? (
              <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Son {remainingSpots}
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex min-h-[3rem] items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <div className="min-w-0 flex-1">
              {(appliedDiscount > 0 || Number(tour.discount) > 0) && (
                <span className="block truncate text-xs text-neutral-400 line-through">
                  ₺{formatPrice(price)}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="truncate text-lg font-semibold text-neutral-900">
                  ₺{formatPrice(discountedPrice)}
                </span>
                <span className="shrink-0 text-xs text-neutral-500">
                  / kişi
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-neutral-950 transition-colors group-hover:text-neutral-700">
                İncele
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              {otherDatesCount > 0 ? (
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-emerald-600">
                  <Calendar className="h-3 w-3" aria-hidden />+{otherDatesCount}{' '}
                  tarih
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
