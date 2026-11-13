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

  if (Array.isArray(out.itinerary)) {
    out.itinerary = out.itinerary.map((day) => {
      if (!day || typeof day !== 'object') return day;
      const row = day as Record<string, unknown>;
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
      };
    });
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
  ] as const) {
    if (typeof out[key] === 'string') {
      out[key] = sanitizeTourPlainText(out[key] as string, 300);
    }
  }

  return out;
}
