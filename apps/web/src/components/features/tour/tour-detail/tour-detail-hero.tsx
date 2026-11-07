'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Building2 as BuildingOfficeIcon,
  CalendarDays as CalendarDaysIcon,
  Clock as ClockIcon,
  Heart as HeartIcon,
  Image as PhotoIcon,
  Map as MapIcon,
  MapPin as MapPinIcon,
  MessageCircle as ChatBubbleLeftRightIcon,
  Share2 as ShareIcon,
  ShieldCheck as ShieldCheckIcon,
  Star as StarIcon,
  Users as UserGroupIcon,
} from 'lucide-react';
import { Star as StarIconSolid } from 'lucide-react';
import { shouldUnoptimizeMedia } from '@/lib/media';
import {
  ICON_BUTTON_DARK_BG_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_DARK_BG_CLASSES,
} from './tour-detail-button-classes';
import { useTourDetailUi } from './tour-detail-context';
import { renderStars } from './render-stars';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

/** Split from tour-detail-client.tsx (Faz 7) — mobile + desktop hero; UI unchanged. */
export function TourDetailHero() {
  const {
    tour,
    destinations,
    displayRating,
    displayReviewCount,
    nights,
    promptDateSelection,
  } = useTourDetailUi();
  const { isTourFavorite, toggleTourFavorite, isMutating } = useFavorites();
  const isFavorite = isTourFavorite(tour.id);

  const primaryButtonClasses = PRIMARY_BUTTON_CLASSES;
  const iconButtonDarkBgClasses = ICON_BUTTON_DARK_BG_CLASSES;
  const secondaryButtonDarkBgClasses = SECONDARY_BUTTON_DARK_BG_CLASSES;

  return (
    <div className="relative">
      {/* ── MOBILE HERO (< md) ── */}
      <div className="md:hidden">
        <div className="relative h-[380px] overflow-hidden">
          {tour.images.length > 0 ? (
            <Image
              src={tour.images[0]}
              alt={tour.name}
              fill
              priority
              unoptimized={shouldUnoptimizeMedia(tour.images[0])}
              style={{ objectFit: 'cover' }}
              className="brightness-[0.85]"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PhotoIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />

          {/* Top row: badge + actions */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-4 pt-14">
            {(tour.isPopular || tour.featured) && (
              <div className="inline-flex items-center bg-neutral-950/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                <StarIconSolid className="h-3.5 w-3.5 text-yellow-300 mr-1.5" />
                <span className="text-white font-semibold uppercase tracking-wider text-[10px]">
                  Popüler Seçim
                </span>
              </div>
            )}
            <div
              className={`flex items-center gap-2 ${!(tour.isPopular || tour.featured) ? 'ml-auto' : ''}`}
            >
              <button
                type="button"
                className={iconButtonDarkBgClasses}
                aria-label={
                  isFavorite ? 'Favorilerden kaldır' : 'Favorilere Ekle'
                }
                disabled={isMutating}
                onClick={() =>
                  void toggleTourFavorite(tour.id, `/tours/${tour.id}`)
                }
              >
                <HeartIcon
                  className={cn('h-5 w-5', isFavorite && 'fill-current')}
                />
              </button>
              <button className={iconButtonDarkBgClasses} aria-label="Paylaş">
                <ShareIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Hero text overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-14">
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="mb-2 break-words text-2xl font-bold leading-tight text-white drop-shadow-md [overflow-wrap:anywhere]">
                  {tour.name}
                </h1>
                <div className="mb-2.5 flex items-start gap-1.5 text-white/90">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-90" />
                  <span className="break-words text-sm leading-snug [overflow-wrap:anywhere]">
                    {destinations.join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 opacity-80" />
                    <span>{tour.duration} gün</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserGroupIcon className="w-3.5 h-3.5 opacity-80" />
                    <span>Maks. {tour.maxParticipants || 10} kişi</span>
                  </div>
                </div>
              </div>

              {displayRating > 0 && (
                <div className="flex-shrink-0 bg-black/55 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-white font-bold text-base leading-none">
                      {displayRating.toFixed(1)}
                    </span>
                    {renderStars(displayRating, 'sm')}
                  </div>
                  {displayReviewCount > 0 && (
                    <p className="text-white/70 text-[11px] text-center">
                      ({displayReviewCount} yorum)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overlapping white info card + CTAs */}
        <div className="relative z-20 -mt-10 mx-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
            <div className="grid grid-cols-4 divide-x divide-gray-100 px-1 py-4">
              <div className="flex flex-col items-center text-center px-1">
                <div className="p-2 bg-neutral-100 rounded-xl mb-1.5">
                  <CalendarDaysIcon className="h-4 w-4 text-neutral-950" />
                </div>
                <p className="text-[9px] text-gray-500 font-medium leading-tight mb-0.5">
                  Tur Süresi
                </p>
                <p className="text-[10px] font-semibold text-gray-900 leading-tight">
                  {tour.duration} Gün
                </p>
                {nights > 0 && (
                  <p className="text-[9px] text-gray-500 leading-tight">
                    {nights} Gece
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center text-center px-1">
                <div className="p-2 bg-neutral-100 rounded-xl mb-1.5">
                  <UserGroupIcon className="h-4 w-4 text-neutral-950" />
                </div>
                <p className="text-[9px] text-gray-500 font-medium leading-tight mb-0.5">
                  Grup Büyüklüğü
                </p>
                <p className="text-[10px] font-semibold text-gray-900 leading-tight">
                  Maks. {tour.maxParticipants || 10}
                </p>
                <p className="text-[9px] text-gray-500 leading-tight">Kişi</p>
              </div>
              <div className="flex flex-col items-center text-center px-1">
                <div className="p-2 bg-neutral-100 rounded-xl mb-1.5">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-neutral-950" />
                </div>
                <p className="text-[9px] text-gray-500 font-medium leading-tight mb-0.5">
                  Rehber
                </p>
                <p className="text-[10px] font-semibold text-gray-900 leading-tight">
                  Profesyonel
                </p>
              </div>
              <div className="flex flex-col items-center text-center px-1">
                <div className="p-2 bg-emerald-50 rounded-xl mb-1.5">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-[9px] text-gray-500 font-medium leading-tight mb-0.5">
                  İptal Güvencesi
                </p>
                <p className="text-[10px] font-semibold text-gray-900 leading-tight">
                  Ücretsiz
                </p>
                <p className="text-[9px] text-gray-500 leading-tight">İptal</p>
              </div>
            </div>

            <div className="flex gap-3 px-4 pb-4 pt-1">
              <Link
                href="#itinerary"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border-2 border-neutral-950 text-neutral-950 text-sm font-semibold rounded-xl transition-colors hover:bg-neutral-100 active:scale-[0.98]"
              >
                <MapIcon className="h-4 w-4 flex-shrink-0" />
                <span>Tur Programı</span>
              </Link>
              <Link
                href="#booking"
                onClick={promptDateSelection}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm active:scale-[0.98]"
              >
                <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                <span>Rezervasyon Yap</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP HERO (md+) — unchanged ── */}
      <div className="hidden md:block relative h-[90vh]">
        <div className="absolute inset-0 overflow-hidden">
          {tour.images.length > 0 ? (
            <Image
              src={tour.images[0]}
              alt={tour.name}
              fill
              priority
              unoptimized={shouldUnoptimizeMedia(tour.images[0])}
              style={{ objectFit: 'cover' }}
              className="brightness-70 transform scale-100 animate-ken-burns-slow"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PhotoIcon className="w-20 h-20 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center pb-36 pt-20">
          <div className="container px-4 text-center max-w-4xl mx-auto w-full">
            <div className="inline-flex items-center mb-5 bg-neutral-950/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-neutral-400/30">
              <StarIconSolid className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-neutral-200 font-medium uppercase tracking-wider text-[11px]">
                Popüler Seçim
              </span>
            </div>
            <h1 className="mb-4 animate-fade-in-up break-words text-[2.75rem] font-bold leading-tight text-white drop-shadow-md [overflow-wrap:anywhere] lg:text-[3.5rem]">
              {tour.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-white/90 mb-8 max-w-3xl mx-auto">
              <div className="flex items-center text-base">
                <MapPinIcon className="w-4 h-4 mr-1.5 opacity-80" />
                <span className="font-normal">{destinations.join(', ')}</span>
              </div>
              <span className="text-white/50 hidden sm:inline">•</span>
              <div className="flex items-center text-base">
                <ClockIcon className="w-4 h-4 mr-1.5 opacity-80" />
                <span className="font-normal">{tour.duration} gün</span>
              </div>
              <span className="text-white/50 hidden sm:inline">•</span>
              <div className="flex items-center text-base">
                <UserGroupIcon className="w-4 h-4 mr-1.5 opacity-80" />
                <span className="font-normal">
                  Maks. {tour.maxParticipants || 10} kişi
                </span>
              </div>
              {tour.accommodation?.name && (
                <span className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-800 px-3 py-1 rounded-full text-xs font-semibold ml-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-neutral-950" />
                  Otel: {tour.accommodation.name}
                </span>
              )}
            </div>
            <div className="flex flex-row flex-wrap justify-center items-center gap-4 w-full mx-auto">
              <Link href="#itinerary" className={primaryButtonClasses}>
                <MapIcon className="h-5 w-5 mr-2" />
                <span>Tur Programı</span>
              </Link>
              <Link
                href="#booking"
                onClick={promptDateSelection}
                className={secondaryButtonDarkBgClasses}
              >
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                <span>Rezervasyon Yap</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-md py-4 border-t border-white/10">
          <div className="container px-4 mx-auto">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-x-6 gap-y-3">
              <div className="flex items-center text-white gap-2.5 group">
                <div className="p-2 bg-white/10 rounded-lg ring-1 ring-white/10 group-hover:bg-white/20 transition-colors duration-150 ease-out">
                  <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Süre
                  </p>
                  <p className="text-sm font-semibold">{tour.duration} Gün</p>
                </div>
              </div>

              <div className="flex items-center text-white gap-2.5 group">
                <div className="p-2 bg-white/10 rounded-lg ring-1 ring-white/10 group-hover:bg-white/20 transition-colors duration-150 ease-out">
                  <UserGroupIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Grup
                  </p>
                  <p className="text-sm font-semibold">
                    Maks. {tour.maxParticipants || 10} kişi
                  </p>
                </div>
              </div>

              <div className="flex items-center text-white gap-2.5 group">
                <div className="p-2 bg-white/10 rounded-lg ring-1 ring-white/10 group-hover:bg-white/20 transition-colors duration-150 ease-out">
                  <MapPinIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Destinasyon
                  </p>
                  <p className="text-sm font-semibold truncate max-w-[150px]">
                    {destinations[0]}
                    {destinations.length > 1
                      ? ` +${destinations.length - 1}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-white gap-2.5 group">
                <div className="p-2 bg-white/10 rounded-lg ring-1 ring-white/10 group-hover:bg-white/20 transition-colors duration-150 ease-out">
                  <StarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Puan
                  </p>
                  <p className="text-sm font-semibold">
                    {displayRating > 0 ? `${displayRating.toFixed(1)}/5` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  className={iconButtonDarkBgClasses}
                  aria-label={
                    isFavorite ? 'Favorilerden kaldır' : 'Favorilere Ekle'
                  }
                  disabled={isMutating}
                  onClick={() =>
                    void toggleTourFavorite(tour.id, `/tours/${tour.id}`)
                  }
                >
                  <HeartIcon
                    className={cn('h-5 w-5', isFavorite && 'fill-current')}
                  />
                </button>
                <button className={iconButtonDarkBgClasses} aria-label="Paylaş">
                  <ShareIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
