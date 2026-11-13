export type SiteNavLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SiteNavSection = {
  title: string;
  links: readonly SiteNavLink[];
};

/** Primary marketing nav (desktop + mobile). */
export const NAV_LINKS: readonly SiteNavLink[] = [
  { label: 'Rotalar', href: '/routes' },
  { label: 'Blog', href: '/blog' },
  { label: 'Hakkımızda', href: '/about' },
  { label: 'İletişim', href: '/contact' },
] as const;

/** Turlar dropdown — no href="#". */
export const TOUR_DROPDOWN_LINKS: readonly SiteNavLink[] = [
  { label: 'Tüm Turlar', href: '/tours' },
  { label: 'Tur Operatörleri', href: '/tour-operator' },
  { label: 'Günübirlik Turlar', href: '/tours?stayKind=DAY_TRIP' },
  { label: 'Haftalık Turlar', href: '/tours?duration=7+' },
] as const;

export const MOBILE_TOUR_EXTRA_LINKS: readonly SiteNavLink[] = [
  { label: 'Öne Çıkanlar', href: '/tours?featured=true' },
] as const;

export const FOOTER_LINK_SECTIONS: readonly SiteNavSection[] = [
  {
    title: 'Keşfet',
    links: [
      { label: 'Turlar', href: '/tours' },
      { label: 'Rotalar', href: '/routes' },
      { label: 'Aktiviteler', href: '/activities' },
      { label: 'Blog', href: '/blog' },
      { label: 'Kampanyalar', href: '/campaigns' },
    ],
  },
  {
    title: 'Şirket',
    links: [
      { label: 'Hakkımızda', href: '/about' },
      { label: 'Kariyer', href: '/careers' },
      { label: 'İletişim', href: '/contact' },
      { label: 'Acente Başvurusu', href: '/partner-register' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { label: 'S.S.S.', href: '/faq' },
      { label: 'Gizlilik Politikası', href: '/privacy' },
      { label: 'Kullanım Şartları', href: '/terms' },
      { label: 'Çerez Politikası', href: '/cookie-policy' },
    ],
  },
] as const;

export const FOOTER_LEGAL_LINKS: readonly SiteNavLink[] = [
  { label: 'Kullanım Şartları', href: '/terms' },
  { label: 'Gizlilik Politikası', href: '/privacy' },
  { label: 'Çerez Politikası', href: '/cookie-policy' },
] as const;

export const AUTH_LINKS = {
  login: '/login',
  register: '/register',
  partnerLogin: '/acente/giris',
  partnerRegister: '/partner-register',
  forgotPassword: '/forgot-password',
  profile: '/profile',
  bookings: '/bookings',
} as const;
