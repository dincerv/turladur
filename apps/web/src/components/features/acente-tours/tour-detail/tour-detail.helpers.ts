import { sanitizePlainText } from '@/components/features/tour/tour-detail/tour-detail.helpers';

import type { TourDetailExtras } from './tour-detail.types';

export { sanitizePlainText };

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitizePlainText(item).slice(0, 300))
    .filter(Boolean);
}

export function departureLabel(value: unknown): string {
  if (Array.isArray(value)) {
    const joined = value
      .filter((v): v is string => typeof v === 'string')
      .map((v) => sanitizePlainText(v).slice(0, 80))
      .filter(Boolean)
      .join(', ');
    return joined || '—';
  }
  if (typeof value === 'string' && value.trim()) {
    return sanitizePlainText(value).slice(0, 120) || '—';
  }
  return '—';
}

export function parseExtras(raw: unknown): TourDetailExtras {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as TourDetailExtras;
}

export function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'Ücretsiz';
  return `${amount.toLocaleString('tr-TR')} ${sanitizePlainText(currency).slice(0, 8) || 'TRY'}`;
}

export function formatDateRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const s = fmt.format(new Date(start));
  const e = fmt.format(new Date(end));
  return s === e ? s : `${s} – ${e}`;
}

export function statusLabel(status: string): string {
  if (status === 'PUBLISHED' || status === 'ACTIVE') return 'Yayında';
  if (status === 'PENDING_REVIEW') return 'İncelemede';
  if (status === 'ARCHIVED') return 'Arşiv';
  return 'Taslak';
}
