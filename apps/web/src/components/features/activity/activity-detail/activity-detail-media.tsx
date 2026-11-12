'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react';
import { shouldUnoptimizeMedia } from '@/lib/media';
import { cn } from '@/lib/utils';

interface ActivityDetailMediaProps {
  images: readonly string[];
  title: string;
}

const THUMBS = 4;

/** Fixed-ratio hero media (no CLS) + keyboard-accessible lightbox. */
export function ActivityDetailMedia({
  images,
  title,
}: ActivityDetailMediaProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const count = images.length;

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) =>
      setLightbox((i) => (i == null ? i : (i + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox, close, step]);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-50 to-neutral-100 text-neutral-400">
        <ImageOff aria-hidden className="h-10 w-10" />
        <span className="text-sm font-medium">Görsel yakında</span>
      </div>
    );
  }

  const thumbs = images.slice(1, 1 + THUMBS);
  const extra = Math.max(0, count - 1 - THUMBS);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setLightbox(0)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        aria-label={`${title} fotoğraflarını büyüt (${count})`}
      >
        <Image
          src={images[0]}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          unoptimized={shouldUnoptimizeMedia(images[0])}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
          <Expand aria-hidden className="h-3.5 w-3.5" />
          {count} fotoğraf
        </span>
      </button>

      {thumbs.length > 0 ? (
        <ul className="mt-2 grid grid-cols-4 gap-2">
          {thumbs.map((src, i) => {
            const index = i + 1;
            const isLast = i === thumbs.length - 1 && extra > 0;
            return (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => setLightbox(index)}
                  className="relative block aspect-square w-full overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  aria-label={`Fotoğraf ${index + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="(max-width: 1024px) 25vw, 15vw"
                    unoptimized={shouldUnoptimizeMedia(src)}
                    className="object-cover"
                  />
                  {isLast ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                      +{extra}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {lightbox != null
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${title} fotoğraf görüntüleyici`}
              className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4"
              onClick={close}
            >
              <button
                type="button"
                onClick={close}
                autoFocus
                className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
              {count > 1
                ? (
                    [
                      {
                        delta: -1,
                        label: 'Önceki',
                        Icon: ChevronLeft,
                        pos: 'left-3 md:left-6',
                      },
                      {
                        delta: 1,
                        label: 'Sonraki',
                        Icon: ChevronRight,
                        pos: 'right-3 md:right-6',
                      },
                    ] as const
                  ).map(({ delta, label, Icon, pos }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        step(delta);
                      }}
                      className={cn(
                        'absolute top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20',
                        pos,
                      )}
                      aria-label={label}
                    >
                      <Icon className="h-6 w-6" />
                    </button>
                  ))
                : null}
              <div
                className="relative h-[min(80vh,720px)] w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={images[lightbox]}
                  alt={`${title} - ${lightbox + 1}`}
                  fill
                  sizes="100vw"
                  unoptimized={shouldUnoptimizeMedia(images[lightbox])}
                  className="object-contain"
                />
              </div>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm tabular-nums text-white/80">
                {lightbox + 1} / {count}
              </p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
