import { resolveMediaUrl } from '@/lib/media';
import { ACTIVITY_TYPES, ALL_CATEGORIES_ID } from './activities-page.constants';
import {
  formatAgeRestriction,
  matchesParticipantAges,
  parseAgeRestriction,
  toSearchKey,
} from './activity-age';
import { sanitizeText } from './activity-filters';
import type {
  ActivityFilters,
  Experience,
  ExperienceApiRow,
} from './activities-page.types';

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n =
    typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toNonNegative(value: unknown): number | null {
  const n = toFiniteNumber(value);
  return n != null && n >= 0 ? n : null;
}

/** "3 saat" → 3, "1,5 saat" → 1.5, "90 dakika" → 1.5, "2 gün" → 48. */
export function parseDurationHours(
  text: string | null | undefined,
): number | null {
  if (typeof text !== 'string') return null;
  const key = toSearchKey(text);
  const match = /(\d+(?:[.,]\d+)?)\s*(saat|sa|dakika|dk|gun|hour|h|min)?/.exec(
    key,
  );
  if (!match) return null;
  const n = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = match[2] ?? 'saat';
  if (unit === 'dakika' || unit === 'dk' || unit === 'min')
    return Math.round((n / 60) * 10) / 10;
  if (unit === 'gun') return n * 24;
  return n;
}

export function mapExperienceRow(row: ExperienceApiRow): Experience | null {
  if (row.id == null) return null;
  const title = sanitizeText(row.title ?? '', 160).trim();
  if (!title) return null;

  const category = row.category?.trim() || null;
  const location = (row.location || row.city || '').trim() || 'Türkiye';
  const durationHours =
    toNonNegative(row.durationHours) ?? parseDurationHours(row.duration);
  const duration =
    row.duration?.trim() ||
    (durationHours != null ? `${durationHours} saat` : '');
  const ageRestriction = parseAgeRestriction(row.ageRestriction);
  const price = toNonNegative(row.price);

  return {
    id: String(row.id),
    title,
    description: (row.description ?? '').trim(),
    imageUrl: resolveMediaUrl(row.coverUrl || row.imageUrl),
    featured: Boolean(row.featured),
    location,
    duration,
    durationHours,
    rating: Math.min(5, toNonNegative(row.averageRating ?? row.rating) ?? 0),
    reviewCount: Math.trunc(toNonNegative(row.reviewCount) ?? 0),
    popularityRate: toNonNegative(row.popularityRate) ?? 0,
    price: price != null && price > 0 ? price : null,
    category,
    categoryKey: category ? toSearchKey(category) : null,
    ageRestriction,
    ageRestrictionLabel: formatAgeRestriction(ageRestriction),
    experienceOperator: row.experienceOperator ?? row.partner ?? null,
    searchText: toSearchKey(
      [title, row.description, location, category, row.experienceType]
        .filter(Boolean)
        .join(' '),
    ),
  };
}

export function mapExperienceRows(rows: readonly unknown[]): Experience[] {
  const seen = new Set<string>();
  const out: Experience[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const mapped = mapExperienceRow(raw as ExperienceApiRow);
    if (!mapped || seen.has(mapped.id)) continue;
    seen.add(mapped.id);
    out.push(mapped);
  }
  return out;
}

const TYPE_KEYWORDS = new Map(ACTIVITY_TYPES.map((t) => [t.id, t.keywords]));

function popularityScore(e: Experience): number {
  return e.popularityRate * 1000 + e.rating * Math.log10(e.reviewCount + 1);
}

export function filterAndSortExperiences(
  items: readonly Experience[],
  f: ActivityFilters,
): Experience[] {
  const qTokens = f.q ? toSearchKey(f.q).split(' ').filter(Boolean) : [];
  const cityKey = f.city ? toSearchKey(f.city) : null;
  const typeKeywords = f.type ? (TYPE_KEYWORDS.get(f.type) ?? null) : null;
  const priceActive = f.minPrice != null || f.maxPrice != null;
  const [minPrice, maxPrice] =
    f.minPrice != null && f.maxPrice != null && f.minPrice > f.maxPrice
      ? [f.maxPrice, f.minPrice]
      : [f.minPrice, f.maxPrice];

  const result = items.filter((e) => {
    if (qTokens.length && !qTokens.every((t) => e.searchText.includes(t)))
      return false;
    if (f.category !== ALL_CATEGORIES_ID && e.categoryKey !== f.category)
      return false;
    if (typeKeywords && !typeKeywords.some((k) => e.searchText.includes(k)))
      return false;
    if (cityKey && !toSearchKey(e.location).includes(cityKey)) return false;
    if (priceActive) {
      if (e.price == null) return false;
      if (minPrice != null && e.price < minPrice) return false;
      if (maxPrice != null && e.price > maxPrice) return false;
    }
    if (
      f.maxDuration != null &&
      e.durationHours != null &&
      e.durationHours > f.maxDuration
    ) {
      return false;
    }
    return matchesParticipantAges(e.ageRestriction, f.minAge, f.maxAge);
  });

  const byPrice = (a: Experience, b: Experience, dir: 1 | -1) => {
    if (a.price == null && b.price == null) return 0;
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return (a.price - b.price) * dir;
  };

  return result.sort((a, b) => {
    switch (f.sort) {
      case 'price_asc':
        return byPrice(a, b, 1);
      case 'price_desc':
        return byPrice(a, b, -1);
      case 'rating':
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      case 'popularity':
      default:
        return (
          Number(b.featured) - Number(a.featured) ||
          popularityScore(b) - popularityScore(a)
        );
    }
  });
}

/** Distinct locations present in the catalog, Turkish-sorted. */
export function getLocationOptions(items: readonly Experience[]): string[] {
  const byKey = new Map<string, string>();
  for (const e of items) {
    const key = toSearchKey(e.location);
    if (key && !byKey.has(key)) byKey.set(key, e.location);
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, 'tr-TR'));
}

export function formatPriceTry(price: number): string {
  return `₺${price.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function calculateTimeLeft(
  targetMs: number,
  nowMs: number = Date.now(),
): TimeLeft {
  const diff = Math.max(0, targetMs - nowMs);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
