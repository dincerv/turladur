'use client';

import Image from 'next/image';
import { useCallback, useId, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEARCH_MAX_LENGTH } from './activities-page.constants';
import { sanitizeText } from './activity-filters';
import { ActivitiesFilterSheet } from './activities-filter-sheet';
import { useActivitiesPage } from './activities-page-context';
import { useDebouncedInput } from './use-debounced-input';

const normalizeQuery = (v: string) => sanitizeText(v).trim();

export function ActivitiesPageHero() {
  const { filters, setFilter, panelFilterCount } = useActivitiesPage();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterWrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const searchId = useId();

  const { draft, setDraft, flush } = useDebouncedInput(
    filters.q,
    (value) => setFilter('q', normalizeQuery(value)),
    { normalize: normalizeQuery },
  );

  const closeFilters = useCallback(() => {
    setIsFilterOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section className="relative h-[520px] w-full md:h-[600px]">
      <Image
        src="https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?q=80&w=2070&auto=format&fit=crop"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-700/70 via-blue-800/60 to-sky-900/70" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mb-8 w-full max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Unutulmaz <span className="text-sky-300">Deneyimler</span> Keşfedin
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base font-light text-sky-100/90 sm:text-lg">
            Türkiye&apos;nin dört bir yanındaki en popüler turları ve
            aktiviteleri bulun.
          </p>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              flush();
              inputRef.current?.blur();
            }}
            className="flex items-center gap-1.5 rounded-full bg-white/95 p-1.5 shadow-xl backdrop-blur-sm"
          >
            <div className="relative flex min-w-0 flex-1 items-center pl-3">
              <Search
                aria-hidden
                className="mr-2.5 h-4 w-4 shrink-0 text-neutral-400"
              />
              <label htmlFor={searchId} className="sr-only">
                Aktivite ara
              </label>
              <input
                ref={inputRef}
                id={searchId}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                maxLength={SEARCH_MAX_LENGTH}
                placeholder="Aktivite, konum veya açıklama ara..."
                className="h-11 w-full min-w-0 bg-transparent text-base text-neutral-900 placeholder-neutral-500 focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              {draft && (
                <button
                  type="button"
                  aria-label="Aramayı temizle"
                  onClick={() => {
                    setDraft('');
                    inputRef.current?.focus();
                  }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative" ref={filterWrapperRef}>
              <button
                ref={triggerRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isFilterOpen}
                aria-label={
                  panelFilterCount > 0
                    ? `Filtrele, ${panelFilterCount} filtre aktif`
                    : 'Filtrele'
                }
                onClick={() => setIsFilterOpen((v) => !v)}
                className={cn(
                  'flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors sm:px-4',
                  isFilterOpen || panelFilterCount > 0
                    ? 'bg-sky-100/80 text-sky-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
                )}
              >
                <SlidersHorizontal aria-hidden className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrele</span>
                {panelFilterCount > 0 && (
                  <span
                    aria-hidden
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-bold text-white"
                  >
                    {panelFilterCount}
                  </span>
                )}
              </button>
              <ActivitiesFilterSheet
                open={isFilterOpen}
                onClose={closeFilters}
                containerRef={filterWrapperRef}
                titleId={titleId}
              />
            </div>

            <button
              type="submit"
              aria-label="Ara"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow-md transition-colors hover:bg-sky-700"
            >
              <Search aria-hidden className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
