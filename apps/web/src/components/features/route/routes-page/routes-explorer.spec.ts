import { describe, expect, it } from 'vitest';

import type { RouteWithStats } from '@/services/route';

import {
  formatDistanceKm,
  haversineKm,
  pathDistanceKm,
  toRouteListItem,
} from './routes-explorer.helpers';

function makeRoute(overrides: Partial<RouteWithStats> = {}): RouteWithStats {
  return {
    id: 'kapadokya',
    name: '  Kapadokya  ',
    description: 'Peri bacaları',
    longDescription: '',
    image: 'https://images.unsplash.com/photo-1',
    location: 'Nevşehir, Türkiye',
    bestTimeToVisit: 'Nisan - Ekim',
    weather: '',
    transportation: '',
    duration: '3-4 gün',
    highlights: [],
    category: 'nature',
    matchKeywords: [],
    tourCount: 4,
    priceRange: null,
    avgRating: 4.6,
    computedDuration: null,
    ...overrides,
  };
}

describe('routes explorer helpers', () => {
  it('computes great-circle distance', () => {
    const istanbul = { latitude: 41.0082, longitude: 28.9784 };
    const ankara = { latitude: 39.9334, longitude: 32.8597 };
    expect(haversineKm(istanbul, ankara)).toBeGreaterThan(345);
    expect(haversineKm(istanbul, ankara)).toBeLessThan(355);
  });

  it('returns null distance for fewer than two stops', () => {
    expect(pathDistanceKm([])).toBeNull();
    expect(pathDistanceKm([{ latitude: 1, longitude: 1 }])).toBeNull();
  });

  it('formats distance in Turkish locale', () => {
    expect(formatDistanceKm(null)).toBeNull();
    expect(formatDistanceKm(4.25)).toBe('4,3 km');
    expect(formatDistanceKm(1234.4)).toBe('1.234 km');
  });

  it('normalizes a curated route with stops, path and distance', () => {
    const item = toRouteListItem(makeRoute());
    expect(item.name).toBe('Kapadokya');
    expect(item.href).toBe('/routes/kapadokya');
    expect(item.categoryLabel).toBe('Doğa & Manzara');
    expect(item.stops.length).toBeGreaterThan(1);
    expect(item.path[0]).toEqual([
      item.stops[0].latitude,
      item.stops[0].longitude,
    ]);
    expect(item.distanceKm).toBeGreaterThan(0);
    expect(item.duration).toBe('3-4 gün');
  });

  it('prefers computed duration and tolerates unknown routes', () => {
    const item = toRouteListItem(
      makeRoute({
        id: 'yeni rota',
        computedDuration: '2 gün',
        avgRating: null,
        image: '',
      }),
    );
    expect(item.href).toBe('/routes/yeni%20rota');
    expect(item.duration).toBe('2 gün');
    expect(item.stops).toEqual([]);
    expect(item.path).toEqual([]);
    expect(item.distanceKm).toBeNull();
    expect(item.avgRating).toBeNull();
    expect(item.image).toBeNull();
  });
});
