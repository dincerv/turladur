import type { LatLngTuple } from 'leaflet';
import {
  CURATED_ROUTE_STOPS,
  isValidGeoCoordinate,
  type CuratedRouteStop,
} from '@turta/shared-constants';

import { resolveMediaUrl } from '@/lib/media';
import type { RouteCategory, RouteWithStats } from '@/services/route';

import type {
  GeoPoint,
  RouteListItem,
  RouteStop,
} from './routes-explorer.types';

export const ROUTE_CATEGORY_LABELS: Record<RouteCategory, string> = {
  historical: 'Tarihi & Kültürel',
  nature: 'Doğa & Manzara',
  beach: 'Deniz & Plaj',
  gastronomy: 'Gastronomi',
  family: 'Aile Dostu',
};

/** Fallback view when no route has coordinates. */
export const TURKEY_CENTER: LatLngTuple = [39.0, 35.2];
export const TURKEY_ZOOM = 6;

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function pathDistanceKm(stops: readonly GeoPoint[]): number | null {
  if (stops.length < 2) return null;
  let total = 0;
  for (let index = 1; index < stops.length; index += 1) {
    total += haversineKm(stops[index - 1], stops[index]);
  }
  return total;
}

export function formatDistanceKm(distanceKm: number | null): string | null {
  if (distanceKm === null || !Number.isFinite(distanceKm)) return null;
  if (distanceKm < 10) {
    return `${distanceKm.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`;
  }
  return `${Math.round(distanceKm).toLocaleString('tr-TR')} km`;
}

export function formatStopCount(count: number): string {
  return `${count} durak`;
}

export function formatRating(rating: number | null): string | null {
  if (rating === null || !Number.isFinite(rating)) return null;
  return rating.toFixed(1);
}

function toCleanText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const text = value.replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function toRouteStops(
  raw: readonly CuratedRouteStop[] | undefined,
): RouteStop[] {
  if (!raw) return [];
  return raw
    .filter((stop) => isValidGeoCoordinate(stop.latitude, stop.longitude))
    .map((stop) => ({
      name: toCleanText(stop.name, 'Durak'),
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));
}

function isRouteCategory(value: unknown): value is RouteCategory {
  return typeof value === 'string' && value in ROUTE_CATEGORY_LABELS;
}

export function toRouteListItem(route: RouteWithStats): RouteListItem {
  const stops = toRouteStops(CURATED_ROUTE_STOPS[route.id]);
  const category: RouteCategory = isRouteCategory(route.category)
    ? route.category
    : 'nature';
  const rating =
    typeof route.avgRating === 'number' && Number.isFinite(route.avgRating)
      ? route.avgRating
      : null;

  return {
    id: route.id,
    href: `/routes/${encodeURIComponent(route.id)}`,
    name: toCleanText(route.name, 'İsimsiz rota'),
    description: toCleanText(route.description),
    location: toCleanText(route.location),
    image: resolveMediaUrl(route.image),
    category,
    categoryLabel: ROUTE_CATEGORY_LABELS[category],
    duration: toCleanText(route.computedDuration, toCleanText(route.duration)),
    bestTimeToVisit: toCleanText(route.bestTimeToVisit),
    tourCount: Number.isFinite(route.tourCount) ? route.tourCount : 0,
    priceRange: toCleanText(route.priceRange) || null,
    avgRating: rating,
    stops,
    path: stops.map((stop) => [stop.latitude, stop.longitude]),
    distanceKm: pathDistanceKm(stops),
  };
}

export function collectPathPoints(
  items: readonly RouteListItem[],
): LatLngTuple[] {
  return items.flatMap((item) => item.path);
}
