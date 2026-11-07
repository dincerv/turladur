'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Image as PhotoIcon,
  X as XMarkIcon,
} from 'lucide-react';
import { shouldUnoptimizeMedia } from '@/lib/media';
import { cn } from '@/lib/utils';
import { sanitizePlainText } from './tour-detail.helpers';

type TourDetailGalleryProps = {
  images: string[];
  tourName: string;
  destinationLabels?: string[];
};

/** Desktop mosaic + mobile swipe gallery with lightbox. */
export function TourDetailGallery({
  images,
  tourName,
  destinationLabels = [],
}: TourDetailGalleryProps) {
  const safeName = sanitizePlainText(tourName) || 'Tur';
  const list = images.filter((src): src is string => Boolean(src));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  const openAt = useCallback(
    (index: number) => {
      if (list.length === 0) return;
      setLightboxIndex(index);
    },
    [list.length],
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const go = useCallback(
    (delta: number) => {
      if (lightboxIndex == null || list.length === 0) return;
      setLightboxIndex((lightboxIndex + delta + list.length) % list.length);
    },
    [lightboxIndex, list.length],
  );

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxIndex, closeLightbox, go]);

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
  const mosaic = list.length > 0 ? list.slice(0, 5) : [];

  return (
    <div className="w-full min-w-0">
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
              className="relative aspect-[4/3] w-[min(100%,280px)] shrink-0 snap-center overflow-hidden rounded-xl bg-neutral-200 shadow-sm"
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

      {/* Desktop — main + side mosaic */}
      <div className="hidden md:block">
        {list.length === 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {placeholders.map((index) => (
              <div
                key={index}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-200"
              >
                <div className="flex h-full w-full items-center justify-center">
                  <PhotoIcon className="h-9 w-9 text-neutral-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-2 sm:gap-3',
              mosaic.length === 1 && 'grid-cols-1',
              mosaic.length === 2 && 'grid-cols-2',
              mosaic.length >= 3 && 'grid-cols-4 grid-rows-2',
            )}
          >
            {mosaic.map((image, index) => {
              const isHero = index === 0 && mosaic.length >= 3;
              const isLastVisible =
                index === mosaic.length - 1 && list.length > mosaic.length;
              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => openAt(index)}
                  className={cn(
                    'group relative overflow-hidden rounded-xl bg-neutral-200 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2',
                    isHero
                      ? 'col-span-2 row-span-2 aspect-[4/3] min-h-[280px]'
                      : mosaic.length >= 3
                        ? 'aspect-[4/3] min-h-0'
                        : 'aspect-[4/3]',
                  )}
                >
                  <Image
                    src={image}
                    alt={`${safeName} - ${index + 1}`}
                    fill
                    sizes={
                      isHero
                        ? '(max-width: 1280px) 50vw, 560px'
                        : '(max-width: 1280px) 25vw, 280px'
                    }
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    unoptimized={shouldUnoptimizeMedia(image)}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="truncate text-xs font-medium text-white">
                        {labelAt(index)}
                      </p>
                    </div>
                  </div>
                  {isLastVisible ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <span className="text-sm font-semibold text-white">
                        +{list.length - mosaic.length + 1} fotoğraf
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lightboxIndex != null && list[lightboxIndex] ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf görüntüleyici"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
            aria-label="Kapat"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          {list.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 md:left-6"
                aria-label="Önceki"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 md:right-6"
                aria-label="Sonraki"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          ) : null}
          <div
            className="relative h-[min(80vh,720px)] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={list[lightboxIndex]}
              alt={`${safeName} - ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              priority
              unoptimized={shouldUnoptimizeMedia(list[lightboxIndex])}
              className="object-contain"
            />
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {lightboxIndex + 1} / {list.length}
          </p>
        </div>
      ) : null}
    </div>
  );
}
