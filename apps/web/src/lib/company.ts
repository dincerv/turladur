/** Public company / office details — single source for contact, footer, legal. */

export const COMPANY = {
  brand: 'turta',
  venue: 'Ankara Teknoloji Köprüsü Kuluçka Merkezi',
  street: '',
  postalCode: '',
  district: 'Çankaya',
  city: 'Ankara',
  country: 'Türkiye',
  hours: 'Pazartesi – Cuma: 09:00 – 18:00',
  /** Ankara Teknoloji Köprüsü Kuluçka Merkezi — Çankaya */
  lat: 39.8915,
  lng: 32.7805,
  emails: {
    info: 'info@turta.com.tr',
    support: 'destek@turta.com.tr',
    /** Privacy / KVKK requests */
    privacy: 'privacy@turta.com.tr',
    partner: 'partner@turta.com.tr',
    /** Alias used on partner login CTAs */
    partners: 'partner@turta.com.tr',
  },
} as const;

export type CompanyEmailKey = keyof typeof COMPANY.emails;

export function getCompanyEmail(key: CompanyEmailKey = 'info'): string {
  return COMPANY.emails[key];
}

/** mailto: with optional subject — single source for legal/support links. */
export function getCompanyMailto(
  key: CompanyEmailKey = 'info',
  subject?: string,
): string {
  const address = getCompanyEmail(key);
  if (!subject) return `mailto:${address}`;
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`;
}

export function getCompanyAddressLines(): string[] {
  return [COMPANY.venue, `${COMPANY.district} / ${COMPANY.city}`];
}

export function getCompanyAddressOneLine(): string {
  return `${COMPANY.venue}, ${COMPANY.district} / ${COMPANY.city}`;
}

export function getCompanyMapsQuery(): string {
  return `${COMPANY.venue}, ${COMPANY.district}, ${COMPANY.city}`;
}

/** Embed with fixed lat/lng so the pin lands on the office, not a vague search. */
export function getCompanyMapsEmbedUrl(): string {
  const { lat, lng } = COMPANY;
  return `https://maps.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=17&hl=tr&output=embed`;
}

export function getCompanyMapsDirectionsUrl(): string {
  const { lat, lng } = COMPANY;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
