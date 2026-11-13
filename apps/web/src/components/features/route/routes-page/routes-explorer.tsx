'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { List, Map as MapIcon } from 'lucide-react';

import { RouteList, RouteListSkeleton } from './route-list';
import {
  RouteSelectionProvider,
  useRouteSelection,
} from './route-selection-context';
import type { MobileView, RouteListItem } from './routes-explorer.types';

const DESKTOP_QUERY = '(min-width: 1024px)';
/** Matches the tablist `scroll-mt-20` so it clears the sticky site header. */
const HEADER_OFFSET_PX = 80;

function RouteMapPlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100"
      aria-hidden
    >
      <MapIcon className="h-8 w-8 animate-pulse text-neutral-300" />
    </div>
  );
}

const RouteMap = dynamic(() => import('./route-map'), {
  ssr: false,
  loading: RouteMapPlaceholder,
});

type RoutesExplorerProps = {
  items: RouteListItem[];
  initialLoading: boolean;
  refreshing: boolean;
};

function RoutesExplorerInner({
  items,
  initialLoading,
  refreshing,
}: RoutesExplorerProps) {
  const { selectedId, select } = useRouteSelection();
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [mapRequested, setMapRequested] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    if (query.matches) {
      setMapRequested(true);
      return;
    }
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMapRequested(true);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (selectedId && !items.some((item) => item.id === selectedId)) {
      select(null, 'list');
    }
  }, [items, selectedId, select]);

  const tablistRef = useRef<HTMLDivElement>(null);

  const showView = useCallback((view: MobileView) => {
    setMobileView(view);
    if (view === 'map') setMapRequested(true);
    const tablist = tablistRef.current;
    if (tablist && tablist.getBoundingClientRect().top < HEADER_OFFSET_PX) {
      tablist.scrollIntoView({ block: 'start' });
    }
  }, []);

  const locate = useCallback(
    (id: string) => {
      select(id, 'list');
      if (!window.matchMedia(DESKTOP_QUERY).matches) showView('map');
    },
    [select, showView],
  );

  const showInList = useCallback(
    (id: string) => {
      select(id, 'map');
      setMobileView('list');
    },
    [select],
  );

  const tabs: Array<{ view: MobileView; label: string; icon: typeof List }> = [
    { view: 'list', label: `Liste (${items.length})`, icon: List },
    { view: 'map', label: 'Harita', icon: MapIcon },
  ];

  return (
    <div>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Görünüm"
        className="mb-4 grid scroll-mt-20 grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1 lg:hidden"
      >
        {tabs.map(({ view, label, icon: Icon }) => {
          const active = mobileView === view;
          return (
            <button
              key={view}
              type="button"
              role="tab"
              id={`routes-tab-${view}`}
              aria-selected={active}
              aria-controls={`routes-panel-${view}`}
              onClick={() => showView(view)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                active
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-8">
        <div
          id="routes-panel-list"
          role="tabpanel"
          aria-labelledby="routes-tab-list"
          aria-busy={initialLoading || refreshing}
          className={`${mobileView === 'list' ? 'block' : 'hidden'} lg:block ${
            refreshing ? 'opacity-60 transition-opacity' : ''
          }`}
        >
          {initialLoading ? (
            <RouteListSkeleton />
          ) : (
            <RouteList
              items={items}
              mobileView={mobileView}
              onLocate={locate}
            />
          )}
        </div>

        <div
          id="routes-panel-map"
          role="tabpanel"
          aria-labelledby="routes-tab-map"
          aria-label="Rota haritası"
          className={`${
            mobileView === 'map' ? 'block' : 'hidden'
          } h-[calc(100svh-12rem)] min-h-[420px] lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-8rem)] lg:min-h-[480px]`}
        >
          {mapRequested && !initialLoading ? (
            <RouteMap items={items} onShowInList={showInList} />
          ) : (
            <RouteMapPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}

export function RoutesExplorer(props: RoutesExplorerProps) {
  return (
    <RouteSelectionProvider>
      <RoutesExplorerInner {...props} />
    </RouteSelectionProvider>
  );
}
