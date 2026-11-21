/** Günlük tur programı — öğün durumu ve gün kartı yardımcıları. */

export const MEAL_STATUSES = ['INCLUDED', 'EXCLUDED', 'FREE_TIME'] as const;
export type MealStatus = (typeof MEAL_STATUSES)[number];

export const MEAL_STATUS_LABELS: Record<MealStatus, string> = {
  INCLUDED: 'Dahil',
  EXCLUDED: 'Hariç',
  FREE_TIME: 'Serbest',
};

export type ItineraryMeals = {
  breakfast?: MealStatus | null;
  lunch?: MealStatus | null;
  dinner?: MealStatus | null;
};

export type ItineraryDayInput = {
  dayNumber?: number;
  title: string;
  description: string;
  highlights?: string[];
  meals?: ItineraryMeals;
  accommodation?: string | null;
  images?: { url: string; file: File | null }[];
};

export function isMealStatus(value: unknown): value is MealStatus {
  return (
    typeof value === 'string' &&
    (MEAL_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeMeals(raw: unknown): ItineraryMeals | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const row = raw as Record<string, unknown>;
  const meals: ItineraryMeals = {};
  if (isMealStatus(row.breakfast)) meals.breakfast = row.breakfast;
  if (isMealStatus(row.lunch)) meals.lunch = row.lunch;
  if (isMealStatus(row.dinner)) meals.dinner = row.dinner;
  return Object.keys(meals).length > 0 ? meals : undefined;
}

export function emptyItineraryDay(dayNumber: number): ItineraryDayInput {
  return {
    dayNumber,
    title: `${dayNumber}. Gün`,
    description: '',
    highlights: [],
    meals: {
      breakfast: 'INCLUDED',
      lunch: 'EXCLUDED',
      dinner: 'EXCLUDED',
    },
    accommodation: '',
    images: [],
  };
}

/** Extras / API’den gelen görsel listesini form {url,file}[] şekline çevir. */
export function normalizeDayImages(
  raw: unknown,
): { url: string; file: null }[] {
  if (!Array.isArray(raw)) return [];
  const urls: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      urls.push(item.trim());
      continue;
    }
    if (item && typeof item === 'object') {
      const url = (item as { url?: unknown }).url;
      if (typeof url === 'string' && url.trim()) urls.push(url.trim());
    }
  }
  return [...new Set(urls)].slice(0, 8).map((url) => ({ url, file: null }));
}

/** Süre değişince gün kartlarını hizala (fazlasını kes, eksiği ekle). */
export function syncItineraryDays(
  days: ItineraryDayInput[],
  durationDays: number,
  options?: { clearAccommodation?: boolean },
): ItineraryDayInput[] {
  const target = Math.max(1, durationDays || 1);
  const next: ItineraryDayInput[] = days.slice(0, target).map((day, index) => ({
    ...day,
    dayNumber: index + 1,
    title: day.title?.trim() ? day.title : `${index + 1}. Gün`,
    accommodation: options?.clearAccommodation ? '' : (day.accommodation ?? ''),
  }));
  while (next.length < target) {
    next.push(emptyItineraryDay(next.length + 1));
  }
  if (options?.clearAccommodation) {
    return next.map((day) => ({ ...day, accommodation: '' }));
  }
  return next;
}

export function itineraryDaysToExtrasArray(
  days: ItineraryDayInput[],
  options?: { omitAccommodation?: boolean },
) {
  return days.map((day, index) => {
    const imageUrls = [
      ...new Set(
        (day.images ?? [])
          .map((img) => img.url?.trim())
          .filter((url): url is string => Boolean(url)),
      ),
    ].slice(0, 8);
    return {
      dayNumber: day.dayNumber ?? index + 1,
      title: day.title.trim() || `${index + 1}. Gün`,
      description: day.description.trim(),
      highlights: (day.highlights ?? [])
        .map((h) => h.trim())
        .filter(Boolean)
        .slice(0, 12),
      meals: {
        breakfast: day.meals?.breakfast ?? null,
        lunch: day.meals?.lunch ?? null,
        dinner: day.meals?.dinner ?? null,
      },
      accommodation: options?.omitAccommodation
        ? null
        : day.accommodation?.trim() || null,
      imageUrls,
      images: imageUrls,
    };
  });
}
