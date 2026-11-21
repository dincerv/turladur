'use client';

import dynamic from 'next/dynamic';

import type { TourRouteMapProps } from './tour-route-map';

export const TourRouteMap = dynamic(
  () => import('./tour-route-map').then((module) => module.TourRouteMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-72 w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-500 sm:h-80 lg:h-[28rem]"
        data-testid="tour-route-map-loading"
      >
        Harita yükleniyor…
      </div>
    ),
  },
);

export type { TourRouteMapProps };
