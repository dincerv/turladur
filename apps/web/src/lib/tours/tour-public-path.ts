/** Public marketplace path — prefer slug, fall back to id. */
export function tourPublicPath(tour: {
  id: string;
  slug?: string | null;
}): string {
  const slug = tour.slug?.trim();
  const key = slug || tour.id;
  return `/tours/${encodeURIComponent(key)}`;
}
