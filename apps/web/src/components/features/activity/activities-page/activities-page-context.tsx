'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ActivitiesFiltersApi } from './use-activities-filters';
import type { CatalogStatus, Experience } from './activities-page.types';

export interface ActivitiesPageContextValue extends ActivitiesFiltersApi {
  status: CatalogStatus;
  retry: () => void;
  locationOptions: readonly string[];
  totalCount: number;
  visibleItems: readonly Experience[];
  hasMore: boolean;
  loadMore: () => void;
}

const ActivitiesPageContext = createContext<ActivitiesPageContextValue | null>(
  null,
);

export function ActivitiesPageProvider({
  value,
  children,
}: {
  value: ActivitiesPageContextValue;
  children: ReactNode;
}) {
  return (
    <ActivitiesPageContext.Provider value={value}>
      {children}
    </ActivitiesPageContext.Provider>
  );
}

export function useActivitiesPage(): ActivitiesPageContextValue {
  const ctx = useContext(ActivitiesPageContext);
  if (!ctx)
    throw new Error(
      'useActivitiesPage must be used within ActivitiesPageProvider',
    );
  return ctx;
}
