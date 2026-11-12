'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { ITEMS_PER_PAGE } from './activities-page/activities-page.constants';
import {
  filterAndSortExperiences,
  getLocationOptions,
} from './activities-page/activities-page.helpers';
import {
  ActivitiesPageProvider,
  type ActivitiesPageContextValue,
} from './activities-page/activities-page-context';
import { ActivitiesPageHero } from './activities-page/activities-page-hero';
import { ActivitiesPageListing } from './activities-page/activities-page-listing';
import { ActivitiesPageMarketing } from './activities-page/activities-page-marketing';
import { ActivityCardSkeleton } from './activities-page/activity-card-skeleton';
import { useActivitiesCatalog } from './activities-page/use-activities-catalog';
import { useActivitiesFilters } from './activities-page/use-activities-filters';

function ActivitiesPageContent() {
  const filtersApi = useActivitiesFilters();
  const { filters, query } = filtersApi;
  const { items, status, retry } = useActivitiesCatalog();

  const results = useMemo(
    () => filterAndSortExperiences(items, filters),
    [items, filters],
  );
  const locationOptions = useMemo(() => getLocationOptions(items), [items]);

  // Paging is keyed by the filter query so any filter change resets to page 1 without an effect.
  const [paging, setPaging] = useState({ key: query, count: ITEMS_PER_PAGE });
  const visibleCount = paging.key === query ? paging.count : ITEMS_PER_PAGE;
  const visibleItems = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount],
  );

  const loadMore = useCallback(() => {
    setPaging({ key: query, count: visibleCount + ITEMS_PER_PAGE });
  }, [query, visibleCount]);

  const value: ActivitiesPageContextValue = useMemo(
    () => ({
      ...filtersApi,
      status,
      retry,
      locationOptions,
      totalCount: results.length,
      visibleItems,
      hasMore: visibleItems.length < results.length,
      loadMore,
    }),
    [
      filtersApi,
      status,
      retry,
      locationOptions,
      results.length,
      visibleItems,
      loadMore,
    ],
  );

  return (
    <ActivitiesPageProvider value={value}>
      <ActivitiesPageHero />
      <main className="w-full bg-neutral-50 py-12 md:py-16">
        <div className="mx-auto w-full max-w-[85rem] px-4 sm:px-6 lg:px-8">
          <ActivitiesPageListing />
          <ActivitiesPageMarketing />
        </div>
      </main>
    </ActivitiesPageProvider>
  );
}

function ActivitiesPageFallback() {
  return (
    <>
      <div className="h-[520px] w-full animate-pulse bg-sky-900/80 md:h-[600px]" />
      <main className="w-full bg-neutral-50 py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-[85rem] grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:gap-8 lg:px-8 xl:grid-cols-4">
          {Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </>
  );
}

export default function ActivitiesPageClient() {
  return (
    <Suspense fallback={<ActivitiesPageFallback />}>
      <ActivitiesPageContent />
    </Suspense>
  );
}
