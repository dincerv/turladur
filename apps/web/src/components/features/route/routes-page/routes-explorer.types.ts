import type { LatLngTuple } from 'leaflet';

import type { RouteCategory } from '@/services/route';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type RouteStop = GeoPoint & {
  name: string;
};

/** Normalized, render-ready route used by both the list and the map. */
export type RouteListItem = {
  id: string;
  href: string;
  name: string;
  description: string;
  location: string;
  image: string | null;
  category: RouteCategory;
  categoryLabel: string;
  duration: string;
  bestTimeToVisit: string;
  tourCount: number;
  priceRange: string | null;
  avgRating: number | null;
  stops: RouteStop[];
  /** Polyline in Leaflet [lat, lng] order; empty when the route has no geo data. */
  path: LatLngTuple[];
  /** Sum of great-circle legs between consecutive stops. */
  distanceKm: number | null;
};

export type RouteSelectionSource = 'list' | 'map';

export type RouteSelectionState = {
  selectedId: string | null;
  hoveredId: string | null;
  source: RouteSelectionSource | null;
};

export type MobileView = 'list' | 'map';
