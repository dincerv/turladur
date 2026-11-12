import {
  ACTIVITY_TYPES,
  AGE_MAX,
  AGE_MIN,
  ALL_CATEGORIES_ID,
  CATEGORIES,
  DEFAULT_FILTERS,
  DURATION_MAX,
  DURATION_MIN,
  FILTER_PARAM,
  PRICE_MAX,
  SEARCH_MAX_LENGTH,
  SORT_OPTIONS,
} from './activities-page.constants';
import { formatParticipantAges, getAgeRangeError } from './activity-age';
import type {
  ActivityFilterChip,
  ActivityFilterChipKey,
  ActivityFilters,
  ActivitySortBy,
} from './activities-page.types';

interface ReadableParams {
  get(name: string): string | null;
}

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const TYPE_IDS = new Set(ACTIVITY_TYPES.map((t) => t.id));
const SORT_IDS = new Set<string>(SORT_OPTIONS.map((s) => s.id));

/** Strips markup/control chars; React already escapes output, this keeps URLs clean. */
const UNSAFE_CHARS = new Set(['<', '>', '"', "'", '`', '\\']);

export function sanitizeText(
  raw: string | null | undefined,
  maxLength = SEARCH_MAX_LENGTH,
): string {
  if (typeof raw !== 'string') return '';
  let out = '';
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127 || UNSAFE_CHARS.has(ch)) continue;
    out += ch;
  }
  return out.replace(/\s+/g, ' ').trimStart().slice(0, maxLength);
}

/** Non-negative integer within [min, max]; anything else (negative, NaN, "1e3", "5abc") → null. */
export function parseBoundedInt(
  raw: string | null | undefined,
  min: number,
  max: number,
): number | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!/^\d{1,7}$/.test(value)) return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) return null;
  return n;
}

function orderPair(
  a: number | null,
  b: number | null,
): [number | null, number | null] {
  return a != null && b != null && a > b ? [b, a] : [a, b];
}

const CITY_RE = /^[a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ\s.-]{2,60}$/;

export function parseActivityFilters(params: ReadableParams): ActivityFilters {
  const category = params.get(FILTER_PARAM.category);
  const type = params.get(FILTER_PARAM.type);
  const sort = params.get(FILTER_PARAM.sort);
  const city = (params.get(FILTER_PARAM.city) ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  const [minPrice, maxPrice] = orderPair(
    parseBoundedInt(params.get(FILTER_PARAM.minPrice), 0, PRICE_MAX),
    parseBoundedInt(params.get(FILTER_PARAM.maxPrice), 0, PRICE_MAX),
  );
  const [minAge, maxAge] = orderPair(
    parseBoundedInt(params.get(FILTER_PARAM.minAge), AGE_MIN, AGE_MAX),
    parseBoundedInt(params.get(FILTER_PARAM.maxAge), AGE_MIN, AGE_MAX),
  );

  return {
    q: sanitizeText(params.get(FILTER_PARAM.q)).trim(),
    category:
      category && CATEGORY_IDS.has(category) ? category : ALL_CATEGORIES_ID,
    type: type && TYPE_IDS.has(type) ? type : null,
    city: city && CITY_RE.test(city) ? city : null,
    minPrice,
    maxPrice,
    maxDuration: parseBoundedInt(
      params.get(FILTER_PARAM.maxDuration),
      DURATION_MIN,
      DURATION_MAX - 1,
    ),
    minAge,
    maxAge,
    sort:
      sort && SORT_IDS.has(sort)
        ? (sort as ActivitySortBy)
        : DEFAULT_FILTERS.sort,
  };
}

/** Canonical query string (stable key order, defaults omitted). */
export function buildActivitiesQuery(filters: ActivityFilters): string {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  if (q) params.set(FILTER_PARAM.q, q);
  if (filters.category !== ALL_CATEGORIES_ID)
    params.set(FILTER_PARAM.category, filters.category);
  if (filters.type) params.set(FILTER_PARAM.type, filters.type);
  if (filters.city) params.set(FILTER_PARAM.city, filters.city);
  if (filters.minPrice != null)
    params.set(FILTER_PARAM.minPrice, String(filters.minPrice));
  if (filters.maxPrice != null)
    params.set(FILTER_PARAM.maxPrice, String(filters.maxPrice));
  if (filters.maxDuration != null)
    params.set(FILTER_PARAM.maxDuration, String(filters.maxDuration));
  if (filters.minAge != null)
    params.set(FILTER_PARAM.minAge, String(filters.minAge));
  if (filters.maxAge != null)
    params.set(FILTER_PARAM.maxAge, String(filters.maxAge));
  if (filters.sort !== DEFAULT_FILTERS.sort)
    params.set(FILTER_PARAM.sort, filters.sort);
  return params.toString();
}

export function hasAgeFilter(f: ActivityFilters): boolean {
  return f.minAge != null || f.maxAge != null;
}

export function hasAnyFilter(f: ActivityFilters): boolean {
  return buildActivitiesQuery({ ...f, sort: DEFAULT_FILTERS.sort }) !== '';
}

const formatTry = (n: number) => `₺${n.toLocaleString('tr-TR')}`;

/** Chips for panel-level filters (search + category have their own controls but q is shown too). */
export function buildFilterChips(f: ActivityFilters): ActivityFilterChip[] {
  const chips: ActivityFilterChip[] = [];
  if (f.q) chips.push({ key: 'q', label: `“${f.q}”` });
  if (f.type) {
    const t = ACTIVITY_TYPES.find((x) => x.id === f.type);
    if (t) chips.push({ key: 'type', label: t.name });
  }
  if (f.city) chips.push({ key: 'city', label: f.city });
  if (f.minPrice != null && f.maxPrice != null) {
    chips.push({
      key: 'price',
      label: `${formatTry(f.minPrice)} - ${formatTry(f.maxPrice)}`,
    });
  } else if (f.minPrice != null) {
    chips.push({ key: 'price', label: `Min ${formatTry(f.minPrice)}` });
  } else if (f.maxPrice != null) {
    chips.push({ key: 'price', label: `Max ${formatTry(f.maxPrice)}` });
  }
  if (f.maxDuration != null)
    chips.push({ key: 'duration', label: `Max ${f.maxDuration} sa` });
  const ages = formatParticipantAges(f.minAge, f.maxAge);
  if (ages) {
    const invalid = getAgeRangeError(f.minAge, f.maxAge) != null;
    chips.push({
      key: 'age',
      label: invalid ? `Yaş: geçersiz aralık` : `Yaş: ${ages}`,
    });
  }
  return chips;
}

/** Number shown on the "Filtrele" button — search & category are visible elsewhere. */
export function countPanelFilters(f: ActivityFilters): number {
  return buildFilterChips(f).filter((c) => c.key !== 'q').length;
}

export function clearFilterChip(
  f: ActivityFilters,
  key: ActivityFilterChipKey,
): ActivityFilters {
  switch (key) {
    case 'q':
      return { ...f, q: '' };
    case 'type':
      return { ...f, type: null };
    case 'city':
      return { ...f, city: null };
    case 'price':
      return { ...f, minPrice: null, maxPrice: null };
    case 'duration':
      return { ...f, maxDuration: null };
    case 'age':
      return { ...f, minAge: null, maxAge: null };
  }
}
