'use client';

import { Search, RotateCcw } from 'lucide-react';

export function ToursNoResults({ onReset }: { onReset: () => void }) {
  return (
    <div
      className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center shadow-sm sm:min-h-[26rem]"
      role="status"
      aria-live="polite"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <Search className="h-8 w-8 text-neutral-500" aria-hidden />
      </div>
      <h3 className="mb-2 text-xl font-bold break-words text-neutral-900">
        Tur bulunamadı
      </h3>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-neutral-600 sm:text-base">
        Arama veya filtrelerinize uygun tur yok. Kriterleri gevşetin ya da tüm
        filtreleri temizleyip yeniden deneyin.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        aria-label="Tüm filtreleri temizle"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        Filtreleri Temizle
      </button>
    </div>
  );
}
