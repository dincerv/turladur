import { ADULT_AGE, AGE_MAX, AGE_MIN } from './activities-page.constants';
import type { AgeRestriction } from './activities-page.types';

export function toSearchKey(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAge(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < AGE_MIN || n > AGE_MAX) return null;
  return n;
}

const NO_LIMIT_RE =
  /(her yas|tum yas|yas siniri yok|yas sinirlamasi yok|sinirsiz|herkes)/;
const RANGE_RE = /(\d{1,3})\s*(?:-|–|—|ile|ila|\/)\s*(\d{1,3})/;
const PLUS_RE = /(\d{1,3})\s*\+/;
const MIN_WORD_RE =
  /(?:(\d{1,3})\s*(?:yas\w*)?\s*(?:ve\s*)?(?:ustu|uzeri|buyuk))|(?:(?:min(?:imum)?|en az|en kucuk)\s*:?\s*(\d{1,3}))/;
const UNDER_RE = /(\d{1,3})\s*(?:yas\w*)?\s*(?:alti|kucuk)/;
const MAX_WORD_RE =
  /(?:max(?:imum)?|maksimum|en fazla|en buyuk)\s*:?\s*(\d{1,3})/;
const LONE_NUMBER_RE = /^(\d{1,3})(?:\s*yas)?$/;

/**
 * Parses free-form partner input ("18+", "7-65", "12 yaş üstü", "65 yaş altı",
 * "Her yaş") into inclusive bounds. Returns `null` when there is no restriction
 * or the text is unparseable.
 */
export function parseAgeRestriction(
  input: string | null | undefined,
): AgeRestriction | null {
  if (typeof input !== 'string') return null;
  const text = toSearchKey(input).slice(0, 60);
  if (!text || NO_LIMIT_RE.test(text)) return null;

  let minAge: number | null = null;
  let maxAge: number | null = null;

  const range = RANGE_RE.exec(text);
  if (range) {
    const a = toAge(range[1]);
    const b = toAge(range[2]);
    if (a != null && b != null) {
      minAge = Math.min(a, b);
      maxAge = Math.max(a, b);
    }
  } else {
    const plus = PLUS_RE.exec(text);
    const minWord = MIN_WORD_RE.exec(text);
    const under = UNDER_RE.exec(text);
    const maxWord = MAX_WORD_RE.exec(text);
    const lone = LONE_NUMBER_RE.exec(text);

    if (plus) minAge = toAge(plus[1]);
    else if (minWord) minAge = toAge(minWord[1] ?? minWord[2]);
    else if (lone) minAge = toAge(lone[1]);

    if (under) {
      const n = toAge(under[1]);
      maxAge = n != null && n > 0 ? n - 1 : null;
    } else if (maxWord) {
      maxAge = toAge(maxWord[1]);
    }
  }

  if (minAge === 0) minAge = null;
  if (minAge == null && maxAge == null) return null;
  if (minAge != null && maxAge != null && minAge > maxAge) return null;
  return { minAge, maxAge };
}

export function formatAgeRestriction(r: AgeRestriction | null): string | null {
  if (!r) return null;
  if (r.minAge != null && r.maxAge != null)
    return `${r.minAge}-${r.maxAge} yaş`;
  if (r.minAge != null) return `${r.minAge}+`;
  if (r.maxAge != null) return `${r.maxAge} yaş ve altı`;
  return null;
}

export function isAdultOnly(r: AgeRestriction | null): boolean {
  return r?.minAge != null && r.minAge >= ADULT_AGE;
}

/** `null` when both bounds are set and inverted — the UI shows a warning instead of filtering. */
export function getAgeRangeError(
  minAge: number | null,
  maxAge: number | null,
): string | null {
  if (minAge != null && maxAge != null && minAge > maxAge) {
    return 'En küçük yaş, en büyük yaştan büyük olamaz.';
  }
  return null;
}

/**
 * Every participant aged within [youngest, oldest] must be allowed by the
 * activity. A single bound is treated as a one-person group.
 */
export function matchesParticipantAges(
  restriction: AgeRestriction | null,
  youngest: number | null,
  oldest: number | null,
): boolean {
  if (!restriction) return true;
  if (youngest == null && oldest == null) return true;
  if (getAgeRangeError(youngest, oldest)) return true;

  const lo = youngest ?? oldest;
  const hi = oldest ?? youngest;
  if (lo == null || hi == null) return true;

  if (restriction.minAge != null && lo < restriction.minAge) return false;
  if (restriction.maxAge != null && hi > restriction.maxAge) return false;
  return true;
}

export function formatParticipantAges(
  youngest: number | null,
  oldest: number | null,
): string | null {
  if (youngest != null && oldest != null) {
    return youngest === oldest
      ? `${youngest} yaş`
      : `${youngest}-${oldest} yaş`;
  }
  if (youngest != null) return `En küçük ${youngest} yaş`;
  if (oldest != null) return `En büyük ${oldest} yaş`;
  return null;
}
