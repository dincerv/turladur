'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { GitCompareArrows, X } from 'lucide-react';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import {
  COMPARE_TOURS_MAX,
  useTourCompareStore,
} from '@/stores/tour-compare-store';

const PLACEHOLDER = 'https://placehold.co/80x80/e5e7eb/6b7280?text=Tur';

/** Renders inside the shared bottom stack (above AI dock) — not independently fixed. */
export function FloatingCompareBar() {
  const selected = useTourCompareStore((state) => state.selected);
  const remove = useTourCompareStore((state) => state.remove);
  const clear = useTourCompareStore((state) => state.clear);
  const openDrawer = useTourCompareStore((state) => state.openDrawer);

  const count = selected.length;

  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          key="floating-compare-bar"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="pointer-events-none flex w-full justify-center"
        >
          <div
            data-testid="floating-compare-bar"
            role="region"
            aria-label="Tur kıyaslama seçimi"
            className="pointer-events-auto flex max-w-md items-center gap-2 rounded-full border border-neutral-200 bg-white/95 py-2 pr-2 pl-3 shadow-xl shadow-neutral-900/10 backdrop-blur-md"
          >
            <div className="flex items-center -space-x-2">
              {selected.slice(0, 4).map((tour) => {
                const src = resolveMediaUrl(tour.coverUrl) || PLACEHOLDER;
                return (
                  <div
                    key={tour.id}
                    data-testid={`compare-bar-thumb-${tour.id}`}
                    className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-neutral-100"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="32px"
                      unoptimized={shouldUnoptimizeMedia(src)}
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>

            <p className="px-1 text-xs font-medium whitespace-nowrap text-neutral-700">
              <span className="font-semibold text-neutral-950">{count}</span>/
              {COMPARE_TOURS_MAX}
            </p>

            <button
              type="button"
              data-testid="clear-compare-selection-btn"
              aria-label="Seçimi temizle"
              onClick={clear}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>

            <button
              type="button"
              data-testid="open-compare-modal-btn"
              aria-label={`Kıyasla ${count} tur`}
              onClick={openDrawer}
              className="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
              Kıyasla
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            </button>

            <span className="sr-only">
              {selected.map((tour) => (
                <button
                  key={tour.id}
                  type="button"
                  data-testid={`compare-bar-remove-${tour.id}`}
                  onClick={() => remove(tour.id)}
                >
                  {tour.title} kaldır
                </button>
              ))}
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
