/** Gün bazlı pin/rota tonları — ferah turizm paleti. */
const DAY_COLORS = [
  '#F97316', // 1. Gün — sıcak mercan / turuncu
  '#0D9488', // 2. Gün — ferah turkuaz / zümrüt
  '#F59E0B', // 3. Gün — sıcak amber
  '#0EA5E9', // 4. Gün — gökyüzü mavisi
  '#E11D48', // 5. Gün — canlı gül
  '#8B5CF6', // 6. Gün — lavanta
] as const;

export function dayColor(dayNumber: number): string {
  return DAY_COLORS[(Math.max(1, dayNumber) - 1) % DAY_COLORS.length];
}

/** Seçili kart / rozet için yumuşak arka plan (hex + alpha). */
export function dayColorSoft(dayNumber: number, alpha = 0.14): string {
  const hex = dayColor(dayNumber).replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** FitBounds iç boşluğu — kenar kontrolleri ve pinlerin kesilmesini önler. */
export const ROUTE_MAP_FIT_PADDING: [number, number] = [64, 64];
export const ROUTE_MAP_MAX_FIT_ZOOM = 13;

export function routeLineStyle(color: string) {
  return {
    color,
    weight: 4,
    opacity: 0.88,
    dashArray: '8 10',
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  };
}

/** Geriye uyumluluk — tek renk kesikli rota. */
export const ROUTE_LINE_STYLE = routeLineStyle('#F97316');

/**
 * Carto CDN — anahtarsız istekte "API KEY REQUIRED" filigranlı PNG.
 * Kullanılmamalı.
 */
export const CARTO_VOYAGER_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
export const CARTO_VOYAGER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * OSM.org — sıkı rate-limit; localhost’ta kısmi tile (bej boşluk) bırakabiliyor.
 * Yedek olarak tutulur, birincil değil.
 */
export const OSM_TILE_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Esri World Street Map — anahtarsız, renkli, kararlı (Leaflet: z/y/x sırası).
 * Carto filigranı / OSM rate-limit sorunlarını aşar.
 */
export const ESRI_STREET_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
export const ESRI_STREET_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, OpenStreetMap';

export type TourMapTileConfig = {
  url: string;
  attribution: string;
};

/**
 * Tur detay / rota haritası — anahtarsız Esri Street (filigransız, eksiksiz tile).
 */
export function resolveTourMapTile(): TourMapTileConfig {
  return {
    url: ESRI_STREET_TILE_URL,
    attribution: ESRI_STREET_ATTRIBUTION,
  };
}

/** Liste / diğer haritalar için güvenli tile. */
export function resolveSafeMapTile(
  fallback: 'voyager' | 'osm' | 'esri' = 'esri',
): TourMapTileConfig {
  const custom = process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim();
  const unsafe =
    !custom ||
    !/^https:\/\//i.test(custom) ||
    /[?&]apikey=/i.test(custom) ||
    /\{r\}/i.test(custom) ||
    /@2x/i.test(custom) ||
    /basemaps\.carto/i.test(custom) ||
    /cartocdn\.com/i.test(custom) ||
    /basemaps\.carto\.com\/basemaps\/apikey/i.test(custom);

  if (!unsafe && custom) {
    const customAttr = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION?.trim();
    const isOsm = /openstreetmap/i.test(custom);
    const isEsri = /arcgisonline\.com/i.test(custom);
    return {
      url: custom,
      attribution:
        customAttr ||
        (isEsri
          ? ESRI_STREET_ATTRIBUTION
          : isOsm
            ? OSM_ATTRIBUTION
            : ESRI_STREET_ATTRIBUTION),
    };
  }

  if (fallback === 'osm') {
    return { url: OSM_TILE_URL, attribution: OSM_ATTRIBUTION };
  }

  // voyager / esri / default → Esri (Carto filigranlı)
  return {
    url: ESRI_STREET_TILE_URL,
    attribution: ESRI_STREET_ATTRIBUTION,
  };
}

/** Bölge / şehir adı → yaklaşık merkez (duraksız tur fallback). */
export const REGION_MAP_CENTERS: Record<string, [number, number]> = {
  trabzon: [40.95, 39.72],
  rize: [41.02, 40.52],
  artvin: [41.18, 41.82],
  gizel: [40.91, 40.55],
  karadeniz: [40.95, 39.72],
  nevşehir: [38.63, 34.72],
  kapadokya: [38.64, 34.83],
  göreme: [38.64, 34.83],
  goreme: [38.64, 34.83],
  antalya: [36.9, 30.71],
  istanbul: [41.01, 28.98],
  i̇stanbul: [41.01, 28.98],
  izmir: [38.42, 27.14],
  i̇zmir: [38.42, 27.14],
  türkiye: [39.0, 35.2],
  turkey: [39.0, 35.2],
};

export function resolveRegionCenter(
  hints: Array<string | null | undefined>,
): [number, number] {
  for (const hint of hints) {
    const key = hint?.trim().toLocaleLowerCase('tr-TR');
    if (!key) continue;
    if (REGION_MAP_CENTERS[key]) return REGION_MAP_CENTERS[key];
    for (const [name, coords] of Object.entries(REGION_MAP_CENTERS)) {
      if (key.includes(name) || name.includes(key)) return coords;
    }
  }
  return [39.0, 35.2];
}
