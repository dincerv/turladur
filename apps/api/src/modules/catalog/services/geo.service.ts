import { Injectable } from '@nestjs/common';

export type GeoPlaceSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

@Injectable()
export class GeoService {
  async searchPlaces(rawQuery: string) {
    const query = rawQuery.trim().slice(0, 120);
    if (query.length < 2) {
      return { success: true, data: [] as GeoPlaceSuggestion[], error: null };
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '0');
    url.searchParams.set('limit', '6');
    url.searchParams.set('countrycodes', 'tr');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TurtaLocal/1.0 (tour-route-stops; contact@turta.local)',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return { success: true, data: [] as GeoPlaceSuggestion[], error: null };
    }

    const payload = (await response.json()) as Array<{
      place_id?: number | string;
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;

    const data: GeoPlaceSuggestion[] = [];
    for (const row of payload) {
      const latitude = Number(row.lat);
      const longitude = Number(row.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      const label = (row.display_name ?? '').trim();
      if (!label) continue;
      data.push({
        id: String(row.place_id ?? `${latitude},${longitude}`),
        label,
        latitude,
        longitude,
      });
    }

    return { success: true, data, error: null };
  }
}
