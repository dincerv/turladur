/**
 * P0-B panel URL constants — FE paths only.
 * Nest API paths under /api/v1/partner/* stay unchanged (P0-A).
 */

export const ACENTE_BASE = '/acente';
export const ACENTE_LOGIN = '/acente/giris';
export const ACENTE_DASHBOARD = '/acente/dashboard';

export const ADMIN_BASE = '/admin';
export const ADMIN_DASHBOARD = '/admin/dashboard';

export const ACENTE_ROUTES = {
  dashboard: '/acente/dashboard',
  tours: '/acente/tours',
  experiences: '/acente/experiences',
  reservations: '/acente/reservations',
  assignments: '/acente/atamalar',
  customers: '/acente/customers',
  financials: '/acente/financials',
  reports: '/acente/reports',
  users: '/acente/users',
  reviews: '/acente/reviews',
  settings: '/acente/settings',
  help: '/acente/help',
  /** P0-B4 — SeatAssignment haritası (MANUAL / AUTO_FIFO). */
  tourDateSeats: (tourId: string, tourDateId: string) =>
    `/acente/tours/${tourId}/dates/${tourDateId}/seats`,
  /** Tur tarihleri arasından koltuk yönetimine geçiş hub’ı. */
  tourSeats: (tourId: string) => `/acente/tours/${tourId}/seats`,
} as const;

const ADMIN_PANEL_ROLES = new Set([
  'ADMIN',
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PLATFORM_SUPER_ADMIN',
]);

const ACENTE_PANEL_ROLES = new Set([
  'PARTNER',
  'PARTNER_STAFF',
  'AGENCY_OWNER',
  'AGENCY_ADMIN',
  'AGENCY_STAFF',
]);

/**
 * Public site header “Panele Dön” — mirrors panel “Site” / “Siteye Dön”.
 * Returns the correct dashboard for the signed-in role, or null.
 */
export function getPanelHrefForRole(
  role: string | null | undefined,
): string | null {
  if (!role) return null;
  if (ADMIN_PANEL_ROLES.has(role)) return ADMIN_DASHBOARD;
  if (ACENTE_PANEL_ROLES.has(role)) return ACENTE_DASHBOARD;
  return null;
}

/** @deprecated Prefer getPanelHrefForRole — kept for existing imports. */
export function getAcentePanelHrefForRole(
  role: string | null | undefined,
): string | null {
  return getPanelHrefForRole(role);
}

export const REHBER_BASE = '/rehber';
export const REHBER_LOGIN = '/rehber/giris';
export const REHBER_REGISTER = '/rehber/kayit';
export const REHBER_DASHBOARD = '/rehber/dashboard';
export const REHBER_MUSAITLIK = '/rehber/musaitlik';

export const OTOBUS_BASE = '/otobus';
export const OTOBUS_LOGIN = '/otobus/giris';
export const OTOBUS_DASHBOARD = '/otobus/dashboard';

export const OTOBUS_ROUTES = {
  dashboard: OTOBUS_DASHBOARD,
  vehicles: '/otobus/araclar',
  vehicleAvailability: (id: string) => `/otobus/araclar/${id}/musaitlik`,
  assignments: '/otobus/atamalar',
} as const;

export const REHBER_ROUTES = {
  dashboard: REHBER_DASHBOARD,
  availability: REHBER_MUSAITLIK,
  assignments: '/rehber/atamalar',
  profile: '/rehber/profil',
  register: REHBER_REGISTER,
} as const;

/** Primary sidebar hrefs for AgencyShell "Ana Menü". */
export const ACENTE_PRIMARY_HREFS: string[] = [
  ACENTE_ROUTES.dashboard,
  ACENTE_ROUTES.tours,
  ACENTE_ROUTES.experiences,
  ACENTE_ROUTES.reservations,
  ACENTE_ROUTES.assignments,
  ACENTE_ROUTES.customers,
  ACENTE_ROUTES.financials,
  ACENTE_ROUTES.reports,
];
