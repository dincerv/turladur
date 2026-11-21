'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  X as XMarkIcon,
} from 'lucide-react';
import { shouldUnoptimizeMedia } from '@/lib/media';
import { cn } from '@/lib/utils';
import { sanitizePlainText } from './tour-detail.helpers';

type Props = {
  images: string[];
  index: number;
  tourName: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  captions?: Array<string | null | undefined>;
};

/** Tam ekran tur fotoğraf görüntüleyici — portal + klavye. */
export function TourPhotoLightbox({
  images,
  index,
  tourName,
  onClose,
  onIndexChange,
  captions = [],
}: Props) {
  const list = images.filter(Boolean);
  const [portalReady, setPortalReady] = useState(false);
  const safeName = sanitizePlainText(tourName) || 'Tur';
  const safeIndex =
    list.length === 0 ? 0 : ((index % list.length) + list.length) % list.length;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (list.length <= 1) return;
      onIndexChange((safeIndex + delta + list.length) % list.length);
    },
    [list.length, onIndexChange, safeIndex],
  );

  useEffect(() => {
    if (list.length === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
  }, [go, list.length, onClose]);

  if (!portalReady || list.length === 0 || !list[safeIndex]) return null;

  const captionRaw = captions[safeIndex];
  const caption = sanitizePlainText(captionRaw ?? '').trim();
  const showCaption =
    Boolean(caption) &&
    captions.length === list.length &&
    !/^(tur\s*lokasyonu|lokasyon|destination|photo|fotoğraf)$/i.test(caption);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Fotoğraf görüntüleyici"
      data-testid="tour-detail-lightbox"
      onClick={onClose}
    >
      <div
        className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <p
            className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold tabular-nums text-white shadow-sm backdrop-blur-md"
            data-testid="tour-detail-lightbox-counter"
          >
            {safeIndex + 1} / {list.length}
          </p>
          <p
            className="hidden min-w-0 truncate text-sm text-white/70 sm:block"
            data-testid="tour-detail-lightbox-tour-name"
            title={safeName}
          >
            {safeName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-md backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95"
          aria-label="Kapat"
          data-testid="tour-detail-lightbox-close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4">
        {list.length > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 sm:left-4 sm:h-14 sm:w-14 md:left-6"
              aria-label="Önceki"
              data-testid="tour-detail-lightbox-prev"
            >
              <ChevronLeftIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-2 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 sm:right-4 sm:h-14 sm:w-14 md:right-6"
              aria-label="Sonraki"
              data-testid="tour-detail-lightbox-next"
            >
              <ChevronRightIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </>
        ) : null}

        <div
          className="relative h-[78vh] max-h-[78vh] w-[86vw] max-w-[86vw]"
          onClick={(e) => e.stopPropagation()}
          data-testid="tour-detail-lightbox-image"
        >
          <Image
            src={list[safeIndex]}
            alt={`${safeName} - ${safeIndex + 1}`}
            fill
            sizes="86vw"
            priority
            unoptimized={shouldUnoptimizeMedia(list[safeIndex])}
            className="object-contain"
          />
        </div>
      </div>

      <div
        className="relative z-20 flex shrink-0 flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        {showCaption ? (
          <p
            className="max-w-xl truncate text-center text-sm font-medium text-white/90"
            data-testid="tour-detail-lightbox-caption"
          >
            {caption}
          </p>
        ) : null}

        {list.length > 1 ? (
          <div
            className="flex max-w-full items-center justify-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            data-testid="tour-detail-lightbox-thumbs"
            role="list"
            aria-label="Fotoğraf önizlemeleri"
          >
            {list.map((image, thumbIndex) => {
              const active = thumbIndex === safeIndex;
              return (
                <button
                  key={`lb-thumb-${thumbIndex}-${image}`}
                  type="button"
                  role="listitem"
                  onClick={() => onIndexChange(thumbIndex)}
                  className={cn(
                    'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-14 sm:w-14',
                    active
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'opacity-70 ring-1 ring-white/20 hover:opacity-100',
                  )}
                  aria-label={`Fotoğraf ${thumbIndex + 1}`}
                  aria-current={active ? 'true' : undefined}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="56px"
                    unoptimized={shouldUnoptimizeMedia(image)}
                    className="object-cover object-center"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
