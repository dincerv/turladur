'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  RouteSelectionSource,
  RouteSelectionState,
} from './routes-explorer.types';

type RouteSelectionContextValue = RouteSelectionState & {
  select: (id: string | null, source: RouteSelectionSource) => void;
  hover: (id: string | null) => void;
};

const RouteSelectionContext = createContext<RouteSelectionContextValue | null>(
  null,
);

const INITIAL_STATE: RouteSelectionState = {
  selectedId: null,
  hoveredId: null,
  source: null,
};

export function RouteSelectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RouteSelectionState>(INITIAL_STATE);

  const select = useCallback(
    (id: string | null, source: RouteSelectionSource) => {
      setState((prev) =>
        prev.selectedId === id && prev.source === source
          ? prev
          : { ...prev, selectedId: id, source },
      );
    },
    [],
  );

  const hover = useCallback((id: string | null) => {
    setState((prev) =>
      prev.hoveredId === id ? prev : { ...prev, hoveredId: id },
    );
  }, []);

  const value = useMemo<RouteSelectionContextValue>(
    () => ({ ...state, select, hover }),
    [state, select, hover],
  );

  return (
    <RouteSelectionContext.Provider value={value}>
      {children}
    </RouteSelectionContext.Provider>
  );
}

export function useRouteSelection(): RouteSelectionContextValue {
  const context = useContext(RouteSelectionContext);
  if (!context) {
    throw new Error(
      'useRouteSelection must be used within RouteSelectionProvider',
    );
  }
  return context;
}
