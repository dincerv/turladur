/**
 * Strip HTML/script payloads from partner-supplied rich text before DB write.
 * Tours are rendered as plain/markdown on B2C — never store raw HTML.
 */
export function sanitizeTourPlainText(input: string, max = 20_000): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function sanitizeTourExtras(
  extras: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!extras || typeof extras !== 'object') return {};

  const out: Record<string, unknown> = { ...extras };

  for (const key of [
    'includes',
    'excludes',
    'inclusions',
    'exclusions',
    'healthPrivileges',
    'features',
    'languages',
    'tags',
  ] as const) {
    const value = out[key];
    if (Array.isArray(value)) {
      out[key] = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => sanitizeTourPlainText(item, 500));
    }
  }

  const sanitizeItineraryDay = (day: unknown) => {
    if (!day || typeof day !== 'object') return day;
    const row = day as Record<string, unknown>;
    const mealsRaw =
      row.meals && typeof row.meals === 'object' && !Array.isArray(row.meals)
        ? (row.meals as Record<string, unknown>)
        : null;
    const mealOk = (v: unknown) =>
      v === 'INCLUDED' || v === 'EXCLUDED' || v === 'FREE_TIME' ? v : null;
    return {
      ...row,
      title:
        typeof row.title === 'string'
          ? sanitizeTourPlainText(row.title, 200)
          : row.title,
      description:
        typeof row.description === 'string'
          ? sanitizeTourPlainText(row.description, 5000)
          : row.description,
      accommodation:
        typeof row.accommodation === 'string'
          ? sanitizeTourPlainText(row.accommodation, 300)
          : row.accommodation,
      highlights: Array.isArray(row.highlights)
        ? row.highlights
            .filter((h): h is string => typeof h === 'string')
            .map((h) => sanitizeTourPlainText(h, 120))
            .slice(0, 12)
        : row.highlights,
      meals: mealsRaw
        ? {
            breakfast: mealOk(mealsRaw.breakfast),
            lunch: mealOk(mealsRaw.lunch),
            dinner: mealOk(mealsRaw.dinner),
          }
        : row.meals,
    };
  };

  if (Array.isArray(out.itinerary)) {
    out.itinerary = out.itinerary.map(sanitizeItineraryDay);
  } else if (
    out.itinerary &&
    typeof out.itinerary === 'object' &&
    !Array.isArray(out.itinerary)
  ) {
    const map = out.itinerary as Record<string, unknown>;
    out.itinerary = Object.fromEntries(
      Object.entries(map).map(([key, day]) => [key, sanitizeItineraryDay(day)]),
    );
  }

  if (Array.isArray(out.destinations)) {
    out.destinations = out.destinations.map((dest) => {
      if (!dest || typeof dest !== 'object') return dest;
      const row = dest as Record<string, unknown>;
      return {
        ...row,
        city:
          typeof row.city === 'string'
            ? sanitizeTourPlainText(row.city, 120)
            : row.city,
        description:
          typeof row.description === 'string'
            ? sanitizeTourPlainText(row.description, 1000)
            : row.description,
      };
    });
  }

  for (const key of [
    'region',
    'transportation',
    'tourType',
    'accommodationType',
    'accommodationName',
    'location',
    'meetingPoint',
    'meetingTime',
    'cancellationPolicy',
    'cancellation',
    'cancelPolicy',
  ] as const) {
    if (typeof out[key] === 'string') {
      out[key] = sanitizeTourPlainText(out[key], 300);
    }
  }

  return out;
}
