'use client';

import { useCallback, useEffect, useRef } from 'react';

import { RouteListCard } from './route-list-card';
import { useRouteSelection } from './route-selection-context';
import type { MobileView, RouteListItem } from './routes-explorer.types';

type RouteListProps = {
  items: RouteListItem[];
  /** Re-runs the scroll sync once a CSS-hidden list becomes visible again. */
  mobileView: MobileView;
  onLocate: (id: string) => void;
};

export function RouteList({ items, mobileView, onLocate }: RouteListProps) {
  const { selectedId, hoveredId, source, select, hover } = useRouteSelection();
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const registerRef = useCallback((id: string, node: HTMLElement | null) => {
    if (node) itemRefs.current.set(id, node);
    else itemRefs.current.delete(id);
  }, []);

  const handleSelect = useCallback(
    (id: string) => select(id, 'list'),
    [select],
  );

  useEffect(() => {
    if (source !== 'map' || !selectedId) return;
    const node = itemRefs.current.get(selectedId);
    if (!node || node.offsetParent === null) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    node.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [selectedId, source, mobileView]);

  return (
    <ul className="space-y-4" aria-label="Rotalar">
      {items.map((item, index) => (
        <li key={item.id}>
          <RouteListCard
            item={item}
            isSelected={selectedId === item.id}
            isHovered={hoveredId === item.id}
            onSelect={handleSelect}
            onLocate={onLocate}
            onHover={hover}
            registerRef={registerRef}
            priority={index < 2}
          />
        </li>
      ))}
    </ul>
  );
}

export function RouteListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-4" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white"
        >
          <div className="aspect-[4/3] w-32 shrink-0 animate-pulse bg-neutral-200 sm:w-44" />
          <div className="flex-1 space-y-2.5 p-3 sm:p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
            <div className="flex gap-1.5 pt-1">
              <div className="h-6 w-16 animate-pulse rounded-md bg-neutral-100" />
              <div className="h-6 w-16 animate-pulse rounded-md bg-neutral-100" />
              <div className="h-6 w-16 animate-pulse rounded-md bg-neutral-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
