'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_FILTERS } from './activities-page.constants';
import {
  buildActivitiesQuery,
  buildFilterChips,
  clearFilterChip,
  countPanelFilters,
  hasAnyFilter,
  parseActivityFilters,
} from './activity-filters';
import type {
  ActivityFilterChipKey,
  ActivityFilters,
} from './activities-page.types';

const MAX_PENDING_WRITES = 20;

/**
 * Filters live in React state (instant UI) and are mirrored to the URL with
 * `history.replaceState`. Our own writes are remembered so their echo through
 * `useSearchParams` is ignored; any other URL change (back/forward, pasted
 * link) is parsed, validated and becomes the new state.
 */
export function useActivitiesFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.toString();

  const [filters, setFilters] = useState<ActivityFilters>(() =>
    parseActivityFilters(searchParams),
  );
  const pendingWritesRef = useRef<string[]>([]);

  const query = useMemo(() => buildActivitiesQuery(filters), [filters]);

  useEffect(() => {
    const pending = pendingWritesRef.current;
    const echoIndex = pending.indexOf(urlQuery);
    if (echoIndex !== -1) {
      pending.splice(0, echoIndex + 1);
      return;
    }
    const parsed = parseActivityFilters(new URLSearchParams(urlQuery));
    const canonical = buildActivitiesQuery(parsed);
    setFilters((prev) =>
      buildActivitiesQuery(prev) === canonical ? prev : parsed,
    );
  }, [urlQuery]);

  useEffect(() => {
    if (query === urlQuery) return;
    const pending = pendingWritesRef.current;
    pending.push(query);
    if (pending.length > MAX_PENDING_WRITES) pending.shift();
    // Native history API: Next keeps useSearchParams in sync without an RSC round-trip.
    window.history.replaceState(
      window.history.state,
      '',
      query ? `${pathname}?${query}` : pathname,
    );
    // urlQuery intentionally omitted: only state changes may write to the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pathname]);

  const setFilter = useCallback(
    <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => {
      setFilters((prev) =>
        Object.is(prev[key], value) ? prev : { ...prev, [key]: value },
      );
    },
    [],
  );

  const patchFilters = useCallback((patch: Partial<ActivityFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(
    () => setFilters({ ...DEFAULT_FILTERS }),
    [],
  );

  const removeChip = useCallback((key: ActivityFilterChipKey) => {
    setFilters((prev) => clearFilterChip(prev, key));
  }, []);

  return useMemo(
    () => ({
      filters,
      query,
      setFilter,
      patchFilters,
      resetFilters,
      removeChip,
      chips: buildFilterChips(filters),
      panelFilterCount: countPanelFilters(filters),
      isFiltered: hasAnyFilter(filters),
    }),
    [filters, query, setFilter, patchFilters, resetFilters, removeChip],
  );
}

export type ActivitiesFiltersApi = ReturnType<typeof useActivitiesFilters>;
