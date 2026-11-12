import { resolveMediaUrl } from '@/lib/media';
import {
  formatAgeRestriction,
  parseAgeRestriction,
} from '../activities-page/activity-age';
import type { MembershipTier } from '../activities-page/activities-page.types';
import type {
  ActivityDetail,
  ActivityMeetingPoint,
  ActivityOperator,
  ActivityScheduleItem,
  ActivitySession,
  ContentBlock,
} from './activity-detail.types';

const MAX_TEXT_LENGTH = 20_000;
const MAX_LINE_LENGTH = 300;
const MAX_LIST_ITEMS = 50;
const MAX_IMAGES = 20;
const MEMBERSHIP_TIERS: readonly MembershipTier[] = [
  'BRONZE',
  'SILVER',
  'GOLD',
];
const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const LIST_MARKER_RE = /^\s*(?:[-*•]|\d{1,2}[.)])\s+/;
/** `javascript:x`, `data:x` — but not "Adres: Göreme". */
const URL_SCHEME_RE = /^[a-z][a-z0-9+.-]*:(?![\d\s])/i;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Finite number from number | numeric string (Prisma Decimal arrives as string). */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

/** Removes C0/C1 control chars except `\n` (no regex — keeps no-control-regex happy). */
function stripControlChars(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (
      code === 10 ||
      (code >= 32 && code !== 127 && !(code >= 128 && code < 160))
    ) {
      out += ch;
    } else if (code === 9) {
      out += ' ';
    }
  }
  return out;
}

/**
 * Partner text → plain text. HTML is never rendered: block tags become line
 * breaks, every other tag is dropped, entities are decoded for display only
 * (React escapes the result).
 */
export function toPlainText(
  input: unknown,
  maxLength = MAX_TEXT_LENGTH,
): string {
  const raw = str(input).slice(0, maxLength * 2);
  if (!raw) return '';
  const text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|h[1-6]|ul|ol|blockquote)\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(
      /&(nbsp|amp|lt|gt|quot|#39|apos);/gi,
      (m) => ENTITIES[m.toLowerCase()] ?? m,
    );
  return stripControlChars(text)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/** Single-line plain text (titles, list items, badges). */
export function toPlainLine(
  input: unknown,
  maxLength = MAX_LINE_LENGTH,
): string {
  return toPlainText(input, maxLength * 2)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Splits plain text into paragraphs and bullet lists for `ContentRenderer`. */
export function toContentBlocks(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    if (lines.every((l) => LIST_MARKER_RE.test(l))) {
      blocks.push({
        kind: 'list',
        items: lines.map((l) => l.replace(LIST_MARKER_RE, '')).filter(Boolean),
      });
    } else {
      blocks.push({ kind: 'paragraph', text: lines.join('\n') });
    }
  }
  return blocks;
}

export function toStringList(value: unknown, max = MAX_LIST_ITEMS): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const line = toPlainLine(item);
    const key = line.toLocaleLowerCase('tr-TR');
    if (!line || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= max) break;
  }
  return out;
}

function toSchedule(value: unknown): ActivityScheduleItem[] {
  if (!Array.isArray(value)) return [];
  const out: ActivityScheduleItem[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const activity = toPlainLine(item);
      if (activity) out.push({ time: '', activity });
    } else if (isRecord(item)) {
      const activity = toPlainLine(item.activity ?? item.title);
      if (activity) out.push({ time: toPlainLine(item.time, 20), activity });
    }
    if (out.length >= MAX_LIST_ITEMS) break;
  }
  return out;
}

/** Only absolute http(s) URLs survive — blocks `javascript:` / `data:` hrefs. */
export function toSafeHttpUrl(value: unknown): string | null {
  const raw = str(value).trim();
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function toMeetingPoint(
  point: unknown,
  address: unknown,
  fallbackLocation: string | null,
): ActivityMeetingPoint | null {
  const pointUrl = toSafeHttpUrl(point);
  const rawText = pointUrl ? '' : toPlainLine(point);
  const pointText = URL_SCHEME_RE.test(rawText) ? '' : rawText;
  const addressText = toPlainLine(address);
  const label = pointText || addressText;
  if (!label && !pointUrl) return null;
  const query = [addressText || pointText, fallbackLocation]
    .filter(Boolean)
    .join(', ');
  return {
    label: label || 'Buluşma noktası',
    address:
      pointText && addressText && addressText !== pointText
        ? addressText
        : null,
    mapUrl: pointUrl ?? buildMapsSearchUrl(query || label),
  };
}

function toOperator(value: unknown): ActivityOperator | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  const companyName = toPlainLine(value.companyName, 120);
  if (!id || !companyName) return null;
  const tier = str(value.membershipTier) as MembershipTier;
  return {
    id,
    companyName,
    logoUrl: resolveMediaUrl(str(value.logo) || null),
    membershipTier: MEMBERSHIP_TIERS.includes(tier) ? tier : null,
    rating: clampRating(toFiniteNumber(value.averageRating)),
    reviewCount: Math.max(
      0,
      Math.trunc(toFiniteNumber(value.reviewCount) ?? 0),
    ),
  };
}

function clampRating(n: number | null): number {
  if (n == null) return 0;
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
}

function toImages(cover: unknown, gallery: unknown): string[] {
  const out: string[] = [];
  const candidates = [cover, ...(Array.isArray(gallery) ? gallery : [])];
  for (const c of candidates) {
    const url = resolveMediaUrl(str(c) || null);
    if (url && !out.includes(url)) out.push(url);
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

/** API payload (any shape / partial deploy) → safe view model, or `null` if unusable. */
export function normalizeActivityDetail(raw: unknown): ActivityDetail | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id) || (typeof raw.id === 'number' ? String(raw.id) : '');
  const title = toPlainLine(raw.title, 160);
  if (!id || !title) return null;

  const summary = toPlainText(raw.description, 600);
  const longDescription = toPlainText(raw.longDescription);
  const location = toPlainLine(raw.location, 120) || null;
  const price = toFiniteNumber(raw.price);
  const reviewCount = Math.max(
    0,
    Math.trunc(toFiniteNumber(raw.reviewCount) ?? 0),
  );
  const ageRestriction = parseAgeRestriction(str(raw.ageRestriction));

  return {
    id,
    title,
    summary,
    longDescription: longDescription === summary ? '' : longDescription,
    category: toPlainLine(raw.category, 60) || null,
    location,
    duration: toPlainLine(raw.duration, 60) || null,
    price: price != null && price > 0 ? price : null,
    currency: toPlainLine(raw.currency, 3).toUpperCase() || 'TRY',
    rating:
      reviewCount > 0 ? clampRating(toFiniteNumber(raw.averageRating)) : 0,
    reviewCount,
    ageRestriction,
    ageRestrictionLabel: formatAgeRestriction(ageRestriction),
    images: toImages(raw.imageUrl, raw.gallery),
    highlights: toStringList(raw.highlights),
    included: toStringList(raw.included),
    notIncluded: toStringList(raw.notIncluded),
    schedule: toSchedule(raw.schedule),
    meetingPoint: toMeetingPoint(
      raw.meetingPoint,
      raw.meetingPointAddress,
      location,
    ),
    operator: toOperator(raw.operator),
  };
}

/** `YYYY-MM-DD` prefix of an API date; never shifts across time zones. */
export function toDateKey(value: unknown): string | null {
  const m = DATE_KEY_RE.exec(str(value));
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return date.getMonth() === Number(mo) - 1 ? `${y}-${mo}-${d}` : null;
}

export function dateKeyToLocalDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Active, future, bookable sessions sorted by date. */
export function normalizeActivitySessions(
  raw: unknown,
  todayKey: string = istanbulTodayKey(),
): ActivitySession[] {
  if (!Array.isArray(raw)) return [];
  const out: ActivitySession[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!isRecord(row) || row.isActive === false) continue;
    const id = str(row.id);
    const startDate = toDateKey(row.startDate);
    const price = toFiniteNumber(row.price);
    const seats = Math.trunc(toFiniteNumber(row.availableSeats) ?? 0);
    if (!id || !startDate || seen.has(id) || price == null || price < 0)
      continue;
    if (seats <= 0 || startDate < todayKey) continue;
    seen.add(id);
    out.push({
      id,
      startDate,
      endDate: toDateKey(row.endDate) ?? startDate,
      price,
      availableSeats: seats,
    });
  }
  return out.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Server runs in UTC; sessions are Turkish calendar days. */
export function istanbulTodayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const DATE_FMT = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  weekday: 'short',
});

export function formatSessionDate(key: string): string {
  return DATE_FMT.format(dateKeyToLocalDate(key));
}

export function formatPrice(price: number, currency = 'TRY'): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${Math.round(price).toLocaleString('tr-TR')} ${currency}`;
  }
}

/** Lowest bookable price wins over the list price so the CTA never under-quotes. */
export function getStartingPrice(
  activity: Pick<ActivityDetail, 'price'>,
  sessions: readonly ActivitySession[],
): number | null {
  if (sessions.length > 0) return Math.min(...sessions.map((s) => s.price));
  return activity.price;
}

/** `<script type="application/ld+json">` payload; `<` escaped so it cannot close the tag. */
export function buildActivityJsonLd(
  activity: ActivityDetail,
  sessions: readonly ActivitySession[],
  url: string,
): string {
  const price = getStartingPrice(activity, sessions);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: activity.title,
    description: activity.summary || undefined,
    image: activity.images.length > 0 ? activity.images.slice(0, 5) : undefined,
    url,
    touristType: activity.category ?? undefined,
    provider: activity.operator
      ? { '@type': 'Organization', name: activity.operator.companyName }
      : undefined,
    aggregateRating:
      activity.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: activity.rating,
            reviewCount: activity.reviewCount,
          }
        : undefined,
    offers:
      price != null
        ? {
            '@type': 'Offer',
            price,
            priceCurrency: activity.currency,
            availability:
              sessions.length > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/PreOrder',
            url,
          }
        : undefined,
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
