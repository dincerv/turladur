import {
  normalizeDayImages,
  normalizeMeals,
  type ItineraryMeals,
} from '@/lib/tours/itinerary-day';

export interface NormalizedItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  highlights?: string[];
  meals?: ItineraryMeals;
  accommodation?: string | null;
  /** Güne atanmış fotoğraf URL’leri. */
  imageUrls?: string[];
  schedule?: { time?: string; activity?: string }[];
  distance?: string;
  duration?: string;
}

/** Removes leading "N. Gün" / "N. Gün - …" when the day is already shown on the timeline. */
export function stripDayPrefixFromTitle(
  title: string,
  dayNumber: number,
): string {
  const trimmed = title.trim();
  if (!trimmed) return trimmed;

  const day = String(dayNumber);
  const withoutPrefix = trimmed
    .replace(new RegExp(`^${day}\\.\\s*Gün\\s*[-–—:]\\s*`, 'iu'), '')
    .replace(new RegExp(`^${day}\\.\\s*Gün\\s*`, 'iu'), '')
    .trim();

  return withoutPrefix;
}

function mapDay(
  item: Record<string, unknown>,
  dayNumber: number,
): NormalizedItineraryDay {
  const highlights = item.highlights ?? item.activities;
  const accommodation =
    typeof item.accommodation === 'string' ? item.accommodation : null;
  const imageUrls = normalizeDayImages(item.imageUrls ?? item.images).map(
    (img) => img.url,
  );
  return {
    dayNumber,
    title: (item.title as string) || `${dayNumber}. Gün`,
    description: (item.description as string) || '',
    highlights: Array.isArray(highlights)
      ? (highlights as string[])
      : undefined,
    meals: normalizeMeals(item.meals),
    accommodation,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    schedule: item.schedule as NormalizedItineraryDay['schedule'],
    distance: item.distance as string | undefined,
    duration: item.duration as string | undefined,
  };
}

export function normalizeItinerary(
  itinerary: unknown,
): NormalizedItineraryDay[] {
  if (!itinerary) return [];

  let data = itinerary;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (Array.isArray(data)) {
    return data.map((item, index) => {
      if (typeof item === 'string') {
        return {
          dayNumber: index + 1,
          title: item,
          description: '',
        };
      }

      const row = (item || {}) as Record<string, unknown>;
      const dayNumber =
        typeof row.dayNumber === 'number'
          ? row.dayNumber
          : typeof row.day === 'number'
            ? row.day
            : index + 1;
      return mapDay(row, dayNumber);
    });
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, content], index) => {
        const item = (content || {}) as Record<string, unknown>;
        const dayNumber = key.startsWith('day')
          ? parseInt(key.replace('day', ''), 10) + 1
          : index + 1;
        return mapDay(item, Number.isFinite(dayNumber) ? dayNumber : index + 1);
      })
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }

  return [];
}
