'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORIES,
  ITEMS_PER_PAGE,
  VISIBLE_CATEGORY_COUNT,
} from './activities-page.constants';
import {
  ActivitiesEmptyState,
  ActivitiesErrorState,
} from './activities-empty-state';
import { ActivityCardSkeleton } from './activity-card-skeleton';
import { ActivityListingCard } from './activity-listing-card';
import { hasAgeFilter } from './activity-filters';
import { useActivitiesPage } from './activities-page-context';

const GRID_CLASS =
  'grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4';
const PRIORITY_CARD_COUNT = 4;

function CategoryPills() {
  const { filters, setFilter } = useActivitiesPage();
  const [expanded, setExpanded] = useState(false);
  const selectedIndex = CATEGORIES.findIndex((c) => c.id === filters.category);
  const showAll = expanded || selectedIndex >= VISIBLE_CATEGORY_COUNT;
  const visible = showAll
    ? CATEGORIES
    : CATEGORIES.slice(0, VISIBLE_CATEGORY_COUNT);

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-800">Kategoriler</h3>
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setExpanded((v) => !v)}
          className="-mr-2 inline-flex min-h-11 items-center gap-1 px-2 text-xs font-medium text-sky-600 hover:text-sky-800 md:min-h-0"
        >
          {showAll ? 'Daha Az Göster' : 'Tümünü Göster'}
          <ChevronDown
            aria-hidden
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              showAll && 'rotate-180',
            )}
          />
        </button>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Kategori seçimi"
      >
        {visible.map((category) => {
          const active = filters.category === category.id;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter('category', category.id)}
              className={cn(
                'min-h-11 rounded-full px-4 text-sm font-medium transition-colors duration-200 md:min-h-9',
                active
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-100',
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActiveFilterChips() {
  const { chips, removeChip, resetFilters } = useActivitiesPage();
  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4">
      <span className="mr-1 text-xs font-semibold text-neutral-600">
        Aktif Filtreler:
      </span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex max-w-full items-center rounded-full bg-sky-100/80 pl-3 text-xs font-semibold text-sky-800"
        >
          <span className="truncate">{chip.label}</span>
          <button
            type="button"
            onClick={() => removeChip(chip.key)}
            aria-label={`${chip.label} filtresini kaldır`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sky-600 hover:text-sky-900 md:h-8 md:w-8"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={resetFilters}
        className="ml-auto inline-flex min-h-11 items-center gap-1 px-2 text-xs font-medium text-neutral-500 hover:text-rose-600 md:min-h-0"
      >
        <Trash2 aria-hidden className="h-3.5 w-3.5" /> Filtreleri Temizle
      </button>
    </div>
  );
}

export function ActivitiesPageListing() {
  const {
    filters,
    status,
    retry,
    totalCount,
    visibleItems,
    hasMore,
    loadMore,
    resetFilters,
    patchFilters,
  } = useActivitiesPage();
  const ageActive = hasAgeFilter(filters);

  return (
    <>
      <CategoryPills />
      <ActiveFilterChips />

      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 lg:text-2xl">
          Aktiviteler
        </h2>
        <p
          className="mt-0.5 min-h-[1rem] text-xs text-neutral-600"
          aria-live="polite"
        >
          {status === 'ready' && `${totalCount} aktivite bulundu.`}
        </p>
      </div>

      {status === 'loading' ? (
        <div
          className={GRID_CLASS}
          aria-busy="true"
          aria-label="Aktiviteler yükleniyor"
        >
          {Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </div>
      ) : status === 'error' ? (
        <ActivitiesErrorState onRetry={retry} />
      ) : visibleItems.length === 0 ? (
        <ActivitiesEmptyState
          onClearAll={resetFilters}
          onClearAge={
            ageActive
              ? () => patchFilters({ minAge: null, maxAge: null })
              : undefined
          }
        />
      ) : (
        <>
          <ul className={GRID_CLASS}>
            {visibleItems.map((experience, index) => (
              <li key={experience.id} className="min-w-0">
                <ActivityListingCard
                  experience={experience}
                  priority={index < PRIORITY_CARD_COUNT}
                />
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-sky-600 px-5 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-sky-700"
              >
                <Plus aria-hidden className="h-4 w-4" />
                Daha Fazla Yükle ({totalCount - visibleItems.length} tane daha)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
