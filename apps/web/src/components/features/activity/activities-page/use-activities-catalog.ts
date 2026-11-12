'use client';

import { useCallback, useEffect, useState } from 'react';
import { searchExperiences } from '@/services/activity';
import { CATALOG_FETCH_LIMIT } from './activities-page.constants';
import { mapExperienceRows } from './activities-page.helpers';
import type { CatalogStatus, Experience } from './activities-page.types';

/** Loads the catalog once; errors surface as a retryable state (no silent demo data). */
export function useActivitiesCatalog() {
  const [items, setItems] = useState<Experience[]>([]);
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    searchExperiences({ limit: CATALOG_FETCH_LIMIT })
      .then(({ data }) => {
        if (cancelled) return;
        setItems(mapExperienceRows(Array.isArray(data) ? data : []));
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (process.env.NODE_ENV !== 'production') {
          console.error('[activities] catalog fetch failed', error);
        }
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { items, status, retry } as const;
}
