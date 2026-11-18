import {
  CANONICAL_DEPARTURE_CITIES,
  normalizeDepartureCity,
  TOUR_GEO_REGIONS,
  type TourGeoRegion,
} from '@turta/shared-constants';
import type {
  AiSearchFilters,
  AiSearchSummaryPill,
  TourDestinationScope,
  TourStayKind,
} from '@turta/shared-types';
import { sanitizeAiSearchPrompt } from '@turta/shared-validators';

const DESTINATION_KEYWORDS = [
  'Uzungöl',
  'Ayder',
  'Kapadokya',
  'Pamukkale',
  'Likya',
  'Boğaz',
  'Trabzon',
  'Rize',
  'Antalya',
  'Bodrum',
  'Fethiye',
  'Marmaris',
  'Kaş',
  'Çeşme',
  'Alaçatı',
  'Sapanca',
  'Abant',
  'Uludağ',
  'Nemrut',
  'Mardin',
  'Gaziantep',
  'Şanlıurfa',
  'Van',
  'İstanbul',
  'İzmir',
  'Ankara',
] as const;

type DurationBucket = NonNullable<AiSearchFilters['duration']>;

function fold(value: string): string {
  return value.toLocaleLowerCase('tr-TR');
}

function extractNights(text: string): number | null {
  const match =
    text.match(/(\d+)\s*gece/) ??
    text.match(/(\d+)\s*night/) ??
    text.match(/(\d+)\s*günlük/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n >= 1 && n <= 30 ? n : null;
}

function nightsToDuration(
  nights: number | null,
  stayKind: TourStayKind | null,
): {
  durationDays: number | null;
  duration: DurationBucket | null;
} {
  if (stayKind === 'DAY_TRIP') {
    return { durationDays: 1, duration: '1' };
  }
  if (nights == null) return { durationDays: null, duration: null };
  const days = nights + 1;
  if (days <= 1) return { durationDays: 1, duration: '1' };
  if (days <= 3) return { durationDays: days, duration: '2-3' };
  if (days <= 6) return { durationDays: days, duration: '4-6' };
  return { durationDays: days, duration: '7+' };
}

function extractStayKind(text: string): TourStayKind | null {
  if (/günübirlik|gunubirlik|tek\s*gün|tek\s*gun|day\s*trip/.test(text)) {
    return 'DAY_TRIP';
  }
  if (/konaklamal[ıi]|geceli|overnight/.test(text)) {
    return 'OVERNIGHT';
  }
  if (extractNights(text) != null) return 'OVERNIGHT';
  return null;
}

function extractScope(text: string): TourDestinationScope | null {
  if (/yurtd[ıi][sş][ıi]|uluslararas[ıi]|abroad|europe|avrupa/.test(text)) {
    return 'INTERNATIONAL';
  }
  if (/yurti[cç]i|domestik|türkiye'?de|turkiye'?de/.test(text)) {
    return 'DOMESTIC';
  }
  return null;
}

function extractDeparture(original: string): string | null {
  const text = fold(original);
  const fromMatch =
    text.match(/([\p{L}]+)'?\s*dan\b/u) ??
    text.match(/([\p{L}]+)'?\s*den\b/u) ??
    text.match(/([\p{L}]+)\s+çıkış/u) ??
    text.match(/([\p{L}]+)\s+kalkış/u);
  if (fromMatch?.[1]) {
    return normalizeDepartureCity(fromMatch[1]);
  }
  for (const city of CANONICAL_DEPARTURE_CITIES) {
    const cityFold = fold(city);
    if (
      text.includes(`${cityFold} çıkış`) ||
      text.includes(`${cityFold}'dan`) ||
      text.includes(`${cityFold}'den`)
    ) {
      return city;
    }
  }
  return null;
}

function extractRegion(text: string): TourGeoRegion | null {
  for (const region of TOUR_GEO_REGIONS) {
    if (fold(text).includes(fold(region))) return region;
  }
  if (fold(text).includes('karadeniz')) return 'Karadeniz';
  if (fold(text).includes('kapadokya')) return 'İç Anadolu';
  return null;
}

function extractDestinations(text: string): string[] {
  const found: string[] = [];
  const folded = fold(text);
  for (const place of DESTINATION_KEYWORDS) {
    if (folded.includes(fold(place)) && !found.includes(place)) {
      found.push(place);
    }
  }
  return found.slice(0, 6);
}

function buildQuery(
  destinations: string[],
  region: string | null,
  leftoverHints: string[],
): string | null {
  // Catalog `q` is a hard contains filter. Prefer region over pin destinations
  // ("Uzungöl olsun") so we don't miss titled tours like "Karadeniz ve Batum".
  // Destinations stay in filters for pills / soft ranking.
  const primary = region ?? destinations[0] ?? leftoverHints[0] ?? null;
  return primary ? primary.slice(0, 100) : null;
}

export function buildAiSearchSummaryPills(
  filters: AiSearchFilters,
): AiSearchSummaryPill[] {
  const pills: AiSearchSummaryPill[] = [];
  if (filters.region) {
    pills.push({ id: 'region', label: filters.region, kind: 'region' });
  }
  if (filters.departureCity) {
    pills.push({
      id: 'departure',
      label: `${filters.departureCity} çıkışlı`,
      kind: 'departure',
    });
  }
  if (filters.nights != null) {
    pills.push({
      id: 'nights',
      label: `${filters.nights} gece`,
      kind: 'duration',
    });
  } else if (filters.durationDays != null) {
    pills.push({
      id: 'days',
      label: `${filters.durationDays} gün`,
      kind: 'duration',
    });
  } else if (filters.duration) {
    pills.push({
      id: 'duration',
      label: `${filters.duration} gün`,
      kind: 'duration',
    });
  }
  if (filters.stayKind === 'DAY_TRIP') {
    pills.push({ id: 'stay', label: 'Günübirlik', kind: 'stay' });
  } else if (filters.stayKind === 'OVERNIGHT') {
    pills.push({ id: 'stay', label: 'Konaklamalı', kind: 'stay' });
  }
  if (filters.destinationScope === 'INTERNATIONAL') {
    pills.push({ id: 'scope', label: 'Yurtdışı', kind: 'scope' });
  } else if (filters.destinationScope === 'DOMESTIC') {
    pills.push({ id: 'scope', label: 'Yurtiçi', kind: 'scope' });
  }
  if (filters.featured) {
    pills.push({ id: 'featured', label: 'Öne çıkanlar', kind: 'featured' });
  }
  for (const destination of filters.destinations) {
    pills.push({
      id: `dest-${destination}`,
      label: destination,
      kind: 'destination',
    });
  }
  return pills;
}

export function buildAiSearchReply(
  filters: AiSearchFilters,
  resultCount: number,
  options?: {
    mode?: 'curated' | 'persona';
    personaLabel?: string | null;
  },
): string {
  if (resultCount === 0) {
    return 'Bu kritere uyan yayınlanmış tur bulamadım. Daha genel bir arama deneyebilir veya filtreleri gevşetebilirsiniz.';
  }
  const bits: string[] = [];
  if (filters.departureCity) bits.push(`${filters.departureCity} çıkışlı`);
  if (filters.region) bits.push(filters.region);
  if (filters.nights != null) bits.push(`${filters.nights} gece`);
  if (filters.destinations.length > 0) {
    bits.push(filters.destinations.join(' & '));
  }
  const focus = bits.length > 0 ? bits.join(', ') : 'isteğinize';
  const mode = options?.mode ?? 'curated';

  if (mode === 'persona' && options?.personaLabel) {
    return `${focus} için ${resultCount} öneri seçtim. “${options.personaLabel}” tercihinize göre yorumları da eşleştirdim — en yüksek puan, en uygun fiyat ve en iyi F/P turlarını yan yana görebilirsiniz.`;
  }

  return `${focus} için ${resultCount} öneri hazırladım: en yüksek puanlı, en uygun fiyatlı ve en iyi fiyat/performans. İsterseniz doğrudan kıyaslayabilirsiniz.`;
}

/**
 * Deterministic TR natural-language → catalog filters.
 * LLM slot can replace/augment this later without changing the DTO contract.
 */
export function parseTourSearchPrompt(rawPrompt: string): AiSearchFilters {
  const prompt = sanitizeAiSearchPrompt(rawPrompt);
  const text = fold(prompt);

  const stayKind = extractStayKind(text);
  const nights = extractNights(text);
  const { durationDays, duration } = nightsToDuration(nights, stayKind);
  const departureCity = extractDeparture(prompt);
  const region = extractRegion(text);
  const destinations = extractDestinations(prompt).filter((place) => {
    if (!departureCity) return true;
    return fold(place) !== fold(departureCity);
  });
  const destinationScope = extractScope(text);
  const featured = /öne\s*çıkan|one\s*cikan|featured|popüler/.test(text);

  const leftoverHints: string[] = [];
  if (/gastronomi|yemek|lezzet/.test(text)) leftoverHints.push('gastronomi');
  if (/tarih|kültür|kultur|müze/.test(text)) leftoverHints.push('kültür');
  if (/doğa|doga|yayla|trekking|hiking/.test(text)) leftoverHints.push('doğa');

  const q = buildQuery(destinations, region, leftoverHints);

  // Prefer duration buckets for recall; exact day only for day-trips.
  const useExactDay = stayKind === 'DAY_TRIP' || duration === '1';

  return {
    q,
    departureCity,
    stayKind,
    destinationScope,
    durationDays: useExactDay ? durationDays : null,
    duration: useExactDay ? null : duration,
    nights,
    region,
    destinations,
    featured,
  };
}
