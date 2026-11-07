/** Split from tour-detail-client.tsx (Faz 7) — helpers only. */

import type { TourDestination } from './tour-detail.types';

/** Strip tags / control chars so agency/tour text is never treated as HTML. */
export function sanitizePlainText(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatPriceTry(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(price) ? price : 0);
}

export function formatAgeRange(minAge: number, maxAge: number | null): string {
  if (maxAge === null) {
    return `${minAge}+`;
  }
  return `${minAge}-${maxAge}`;
}

export function formatPricing(
  pricingType: string,
  value: number,
  _basePrice: number,
): string {
  void _basePrice;
  switch (pricingType) {
    case 'free':
      return 'Ücretsiz';
    case 'percentage':
      return `%${value} İndirimli`;
    case 'fixed':
      return `${value.toLocaleString('tr-TR')} ₺`;
    default:
      return `${value.toLocaleString('tr-TR')} ₺`;
  }
}

export function getDestinationLabel(destination: TourDestination): string {
  if (typeof destination === 'string') return destination;
  return destination?.city ?? '';
}

export function buildFallbackItinerary(
  durationDays: number,
  destinationNames: string[],
): Record<string, unknown> {
  const days = Math.max(1, durationDays || 1);
  const itinerary: Record<string, unknown> = {};
  for (let index = 0; index < days; index += 1) {
    const city = destinationNames[index] || destinationNames[0] || '';
    const isFirst = index === 0;
    const isLast = index === days - 1;
    itinerary[`day${index}`] = {
      title: city
        ? `${index + 1}. Gün - ${city}`
        : `${index + 1}. Gün programı`,
      description: isFirst
        ? 'Buluşma noktasında toplanma, rehber tanışması ve tur başlangıcı.'
        : isLast
          ? 'Programın tamamlanması, serbest zaman ve dönüş hazırlığı.'
          : 'Rehber eşliğinde destinasyon gezisi, önemli noktaların ziyareti ve günlük aktiviteler.',
      highlights: city ? [`${city} gezisi`] : ['Günlük program'],
      schedule: [],
    };
  }
  return itinerary;
}
