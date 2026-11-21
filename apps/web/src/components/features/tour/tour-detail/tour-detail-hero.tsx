'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Clock as ClockIcon,
  Heart as HeartIcon,
  Map as MapIcon,
  Share2 as ShareIcon,
  Star as StarIconSolid,
  Users as UserGroupIcon,
} from 'lucide-react';
import { tourPublicPath } from '@/lib/tours/tour-public-path';
import { shouldUnoptimizeMedia } from '@/lib/media';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';
import { TourDetailGallery } from './tour-detail-gallery';
import { useTourDetailUi } from './tour-detail-context';
import { metaDestinations, sanitizePlainText } from './tour-detail.helpers';
import { renderStars } from './render-stars';

const GLASS_ICON_BTN =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-sm backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 disabled:opacity-60';

/** Full-bleed kapak + yüzen mini galeri (ana sayfa hero dili). */
export function TourDetailHero() {
  const {
    tour,
    destinations,
    displayRating,
    displayReviewCount,
    galleryImages,
    tourOperator,
    promptDateSelection,
  } = useTourDetailUi();
  const { isTourFavorite, toggleTourFavorite, isMutating } = useFavorites();
  const isFavorite = isTourFavorite(tour.id);
  const places = metaDestinations(tour.name, destinations);
  const showPopular = Boolean(tour.isPopular || tour.featured);
  const cover = galleryImages[0] ?? null;
  const safeTitle = sanitizePlainText(tour.name) || 'Tur';
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(cover) && !coverFailed;

  return (
    <section
      data-testid="tour-detail-hero"
      className="relative w-full overflow-hidden bg-slate-900"
    >
      <div className="relative h-[420px] w-full bg-slate-900 md:h-[540px] md:min-h-[60vh]">
        {showCover ? (
          <Image
            src={cover!}
            alt={safeTitle}
            fill
            priority
            sizes="100vw"
            unoptimized={shouldUnoptimizeMedia(cover)}
            className="object-cover object-center"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-neutral-950"
          />
        )}

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40"
        />

        <div className="absolute right-4 top-[max(5.5rem,env(safe-area-inset-top)+4.5rem)] z-10 flex items-center gap-2 sm:right-6 md:right-8 lg:right-10">
          <button
            type="button"
            className={GLASS_ICON_BTN}
            aria-label={isFavorite ? 'Favorilerden kaldır' : 'Favorilere Ekle'}
            disabled={isMutating}
            onClick={() =>
              void toggleTourFavorite(tour.id, tourPublicPath(tour))
            }
          >
            <HeartIcon
              className={cn(
                'h-5 w-5',
                isFavorite && 'fill-current text-rose-400',
              )}
            />
          </button>
          <button type="button" className={GLASS_ICON_BTN} aria-label="Paylaş">
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="container mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6 sm:pb-8 md:pb-10 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1 text-white">
                {showPopular ? (
                  <div className="mb-2.5 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md sm:text-[11px]">
                    <StarIconSolid className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
                    Popüler Seçim
                  </div>
                ) : null}
                <h1 className="break-words text-2xl font-bold tracking-tight text-white drop-shadow-sm [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
                  {safeTitle}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/90">
                  {displayRating > 0 ? (
                    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 font-medium text-white">
                      <span className="inline-flex items-center gap-1">
                        {renderStars(displayRating, 'sm')}
                        <span>{displayRating.toFixed(1)}</span>
                      </span>
                      {displayReviewCount > 0 ? (
                        <span className="font-normal text-white/75">
                          ({displayReviewCount} yorum)
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {tourOperator?.companyName ? (
                    <>
                      {displayRating > 0 ? (
                        <span className="text-white/40" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <Link
                        href={`/tour-operator/${tourOperator.id}`}
                        className="font-medium text-white underline-offset-2 transition hover:underline"
                      >
                        {sanitizePlainText(tourOperator.companyName)}
                      </Link>
                    </>
                  ) : null}
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md sm:text-sm">
                    <ClockIcon className="h-3.5 w-3.5 text-white/80" />
                    {tour.duration} gün
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md sm:text-sm">
                    <UserGroupIcon className="h-3.5 w-3.5 text-white/80" />
                    Maks. {tour.maxParticipants || 10} kişi
                  </span>
                  {places[0] ? (
                    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md sm:text-sm">
                      {places.slice(0, 2).join(', ')}
                      {places.length > 2 ? ` +${places.length - 2}` : ''}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 self-end lg:pb-1">
                <TourDetailGallery
                  images={galleryImages}
                  tourName={tour.name}
                  destinationLabels={places}
                  variant="hero"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-neutral-200/70 bg-neutral-50 md:hidden">
        <div className="container mx-auto flex max-w-7xl flex-wrap gap-3 px-4 py-4">
          <Link
            href="#itinerary"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-neutral-950 px-3 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
          >
            <MapIcon className="h-4 w-4" />
            Tur Programı
          </Link>
          <Link
            href="#booking"
            onClick={promptDateSelection}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Rezervasyon Yap
          </Link>
        </div>
      </div>
    </section>
  );
}
