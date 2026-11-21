'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Image as PhotoIcon,
} from 'lucide-react';
import { shouldUnoptimizeMedia } from '@/lib/media';
import { cn } from '@/lib/utils';
import { sanitizePlainText } from './tour-detail.helpers';
import { useTourDetailUi } from './tour-detail-context';

type TourDetailGalleryProps = {
  images: string[];
  tourName: string;
  destinationLabels?: string[];
  /** Hero: yüzen mini önizleme + lightbox. Section: mozaik galeri. */
  variant?: 'section' | 'hero';
};

/** Desktop mosaic / hero mini thumbs — lightbox bağlam üzerinden açılır. */
export function TourDetailGallery({
  images,
  tourName,
  destinationLabels = [],
  variant = 'section',
}: TourDetailGalleryProps) {
  const { openGalleryAt } = useTourDetailUi();
  const safeName = sanitizePlainText(tourName) || 'Tur';
  const list = images.filter((src): src is string => Boolean(src));
  const [failedThumbs, setFailedThumbs] = useState<Record<string, true>>({});
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  const openAt = useCallback(
    (index: number) => {
      if (list.length === 0) return;
      openGalleryAt(index);
    },
    [list.length, openGalleryAt],
  );

  const scrollMobile = (direction: 'prev' | 'next') => {
    const el = mobileTrackRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth * 0.85);
    el.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  const labelAt = (index: number) =>
    destinationLabels[index % Math.max(destinationLabels.length, 1)] ||
    'Tur Lokasyonu';

  const placeholders = Array.from({ length: 4 }, (_, i) => i);
  /** Max 5 tiles: 1 hero + up to 4 side (2×2) when enough photos. */
  const mosaic =
    list.length === 0
      ? []
      : list.length === 1
        ? list.slice(0, 1)
        : list.length === 2
          ? list.slice(0, 2)
          : list.length <= 4
            ? list.slice(0, 3)
            : list.slice(0, 5);
  const extraCount = Math.max(0, list.length - mosaic.length);
  const isHero = variant === 'hero';
  const tileRadius = isHero ? 'rounded-2xl' : 'rounded-xl';
  const previewThumbs = list.length > 1 ? list.slice(1, 3) : [];

  if (isHero) {
    return (
      <div className="w-full min-w-0" data-testid="tour-detail-gallery">
        {list.length > 1 ? (
          <div className="flex items-end justify-end gap-2 sm:gap-2.5">
            {previewThumbs.map((image, index) => {
              const absoluteIndex = index + 1;
              const thumbKey = `${absoluteIndex}:${image}`;
              if (failedThumbs[thumbKey]) return null;
              return (
                <button
                  key={thumbKey}
                  type="button"
                  onClick={() => openAt(absoluteIndex)}
                  className="group relative h-14 w-14 overflow-hidden rounded-xl border border-white/30 bg-slate-800/80 shadow-md backdrop-blur-md transition hover:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-16 sm:w-16 md:h-[72px] md:w-[72px]"
                  aria-label={`${safeName} fotoğraf ${absoluteIndex + 1}`}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="72px"
                    unoptimized={shouldUnoptimizeMedia(image)}
                    className="object-cover object-center transition duration-300 group-hover:scale-105"
                    onError={() =>
                      setFailedThumbs((prev) => ({ ...prev, [thumbKey]: true }))
                    }
                  />
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => openAt(0)}
              className="inline-flex h-14 items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3 text-xs font-semibold text-white shadow-md backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-16 sm:px-3.5 sm:text-sm md:h-[72px]"
            >
              <PhotoIcon className="h-4 w-4 shrink-0 opacity-90" />
              <span className="whitespace-nowrap">
                Tüm fotoğraflar ({list.length})
              </span>
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="w-full min-w-0 overflow-hidden"
      data-testid="tour-detail-gallery"
    >
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <h2 className="flex min-w-0 items-center text-lg font-semibold text-gray-900 sm:text-xl">
          <PhotoIcon className="mr-2 h-5 w-5 shrink-0 text-neutral-950 sm:mr-2.5 sm:h-6 sm:w-6" />
          <span className="truncate">Fotoğraf Galerisi</span>
        </h2>
        {list.length > 0 ? (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="flex shrink-0 items-center text-xs font-medium text-neutral-950 transition-colors hover:text-neutral-700 active:scale-[0.98] sm:text-sm"
          >
            Tüm Fotoğraflar
            {list.length > 1 ? (
              <span className="ml-1 text-neutral-500">({list.length})</span>
            ) : null}
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Mobile — swipeable */}
      <div className="relative md:hidden">
        <div
          ref={mobileTrackRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(list.length > 0 ? list : [null]).map((image, index) => (
            <button
              key={image ?? `ph-${index}`}
              type="button"
              onClick={() => image && openAt(index)}
              className={cn(
                'relative aspect-[4/3] w-[min(100%,280px)] shrink-0 snap-center overflow-hidden bg-neutral-200 shadow-sm',
                tileRadius,
              )}
              aria-label={
                image ? `${safeName} fotoğraf ${index + 1}` : 'Fotoğraf yok'
              }
            >
              {image ? (
                <Image
                  src={image}
                  alt={`${safeName} - ${index + 1}`}
                  fill
                  sizes="280px"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  unoptimized={shouldUnoptimizeMedia(image)}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PhotoIcon className="h-8 w-8 text-neutral-400" />
                </div>
              )}
            </button>
          ))}
        </div>
        {list.length > 1 ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => scrollMobile('prev')}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-800 shadow-sm transition hover:bg-white active:scale-95"
              aria-label="Önceki fotoğraf"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollMobile('next')}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-800 shadow-sm transition hover:bg-white active:scale-95"
              aria-label="Sonraki fotoğraf"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Desktop — main + side mosaic (fixed height, no empty cells) */}
      <div className="hidden md:block">
        {list.length === 0 ? (
          <div className="grid h-[320px] grid-cols-2 gap-2 sm:gap-3 lg:h-[420px]">
            {placeholders.slice(0, 2).map((index) => (
              <div
                key={index}
                className={cn(
                  'relative h-full overflow-hidden bg-neutral-100',
                  tileRadius,
                )}
              >
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400">
                  <PhotoIcon className="h-9 w-9" />
                  <span className="text-xs font-medium">Fotoğraf yok</span>
                </div>
              </div>
            ))}
          </div>
        ) : mosaic.length === 1 ? (
          <button
            type="button"
            onClick={() => openAt(0)}
            className={cn(
              'group relative h-[320px] w-full overflow-hidden bg-neutral-200 lg:h-[420px]',
              tileRadius,
            )}
          >
            <Image
              src={mosaic[0]}
              alt={`${safeName} - 1`}
              fill
              sizes="(max-width: 1280px) 66vw, 720px"
              priority
              unoptimized={shouldUnoptimizeMedia(mosaic[0])}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ) : mosaic.length === 2 ? (
          <div className="grid h-[320px] grid-cols-2 gap-2 sm:gap-3 lg:h-[420px]">
            {mosaic.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => openAt(index)}
                className={cn(
                  'group relative h-full min-h-0 overflow-hidden bg-neutral-200',
                  tileRadius,
                )}
              >
                <Image
                  src={image}
                  alt={`${safeName} - ${index + 1}`}
                  fill
                  sizes="(max-width: 1280px) 33vw, 360px"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  unoptimized={shouldUnoptimizeMedia(image)}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        ) : mosaic.length >= 5 ? (
          <div className="grid h-[320px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2 sm:gap-3 lg:h-[420px]">
            <button
              type="button"
              onClick={() => openAt(0)}
              className={cn(
                'group relative min-h-0 min-w-0 overflow-hidden bg-neutral-200 shadow-sm',
                tileRadius,
              )}
            >
              <Image
                src={mosaic[0]}
                alt={`${safeName} - 1`}
                fill
                sizes="(max-width: 1280px) 45vw, 480px"
                priority
                unoptimized={shouldUnoptimizeMedia(mosaic[0])}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
            <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
              {mosaic.slice(1, 5).map((image, index) => {
                const absoluteIndex = index + 1;
                const showExtra = absoluteIndex === 4 && extraCount > 0;
                return (
                  <button
                    key={`${image}-${absoluteIndex}`}
                    type="button"
                    onClick={() => openAt(absoluteIndex)}
                    className={cn(
                      'group relative min-h-0 min-w-0 overflow-hidden bg-neutral-200 shadow-sm',
                      tileRadius,
                    )}
                  >
                    <Image
                      src={image}
                      alt={`${safeName} - ${absoluteIndex + 1}`}
                      fill
                      sizes="(max-width: 1280px) 18vw, 200px"
                      loading="lazy"
                      unoptimized={shouldUnoptimizeMedia(image)}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {showExtra ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                        +{extraCount} fotoğraf
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid h-[320px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid-rows-2 gap-2 sm:gap-3 lg:h-[420px]">
            {mosaic.map((image, index) => {
              const mainTile = index === 0;
              const showExtra = index === mosaic.length - 1 && extraCount > 0;
              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => openAt(index)}
                  className={cn(
                    'group relative min-h-0 min-w-0 overflow-hidden bg-neutral-200 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2',
                    tileRadius,
                    mainTile ? 'row-span-2' : 'row-span-1',
                  )}
                >
                  <Image
                    src={image}
                    alt={`${safeName} - ${index + 1}`}
                    fill
                    sizes={
                      mainTile
                        ? '(max-width: 1280px) 45vw, 480px'
                        : '(max-width: 1280px) 22vw, 240px'
                    }
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    unoptimized={shouldUnoptimizeMedia(image)}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="truncate text-xs font-medium text-white">
                        {labelAt(index)}
                      </p>
                    </div>
                  </div>
                  {showExtra ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <span className="text-sm font-semibold text-white">
                        +{extraCount} fotoğraf
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
