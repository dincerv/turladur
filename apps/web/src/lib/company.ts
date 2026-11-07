/** Public company / office details — single source for contact, footer, legal. */

export const COMPANY = {
  brand: 'turta',
  venue: 'Bilkent Cyberpark Dikmen Girişim Ofisi',
  street: 'İlkadım Mahallesi, Yeşilvadi Caddesi No:41 İç Kapı No:14',
  postalCode: '06450',
  district: 'Çankaya',
  city: 'Ankara',
  country: 'Türkiye',
  hours: 'Pazartesi – Cuma: 09:00 – 18:00',
  /** Yeşilvadi Cad. / Cyberpark Dikmen — pin for Maps embed */
  lat: 39.887074,
  lng: 32.842258,
  emails: {
    info: 'info@turta.com.tr',
    support: 'destek@turta.com.tr',
    partner: 'partner@turta.com.tr',
  },
} as const;

export function getCompanyAddressLines(): string[] {
  return [
    COMPANY.venue,
    COMPANY.street,
    `${COMPANY.postalCode} ${COMPANY.district} / ${COMPANY.city}`,
  ];
}

export function getCompanyAddressOneLine(): string {
  return getCompanyAddressLines().join(', ');
}

export function getCompanyMapsQuery(): string {
  return `${COMPANY.venue}, ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.district} ${COMPANY.city}`;
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
