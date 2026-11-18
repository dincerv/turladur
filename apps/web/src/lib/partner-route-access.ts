import type { StaffPermissionKey } from '@turta/shared-types';

/**
 * Maps acente dashboard routes to staff permission keys.
 * `null` = any authenticated agency staff may access.
 * `owner` = only AGENCY_OWNER / ADMIN (not AGENCY_STAFF).
 */
export type PartnerRouteAccess =
  StaffPermissionKey | 'owner' | 'agency_owner' | null;

export type PartnerNavPermission = PartnerRouteAccess;

export function resolvePartnerRouteAccess(
  pathname: string,
): PartnerRouteAccess {
  const path = pathname.split('?')[0] || pathname;

  if (path.startsWith('/acente/tours')) return 'tours';
  if (path.startsWith('/acente/experiences')) return 'tours';
  if (path.startsWith('/acente/reservations')) return 'reservations';
  if (path.startsWith('/acente/atamalar')) return 'tours';
  if (path.startsWith('/acente/customers')) return 'customers';
  if (path.startsWith('/acente/financials')) return 'financials';
  if (path.startsWith('/acente/reports')) return 'reports';
  if (path.startsWith('/acente/reviews')) return 'customers';
  if (path.startsWith('/acente/users')) return 'agency_owner';
  if (path.startsWith('/acente/settings')) return 'settings';
  return null;
}

/** Yazma gerektiren acente yolları (/new, /edit). */
export function partnerRouteRequiresWrite(pathname: string): boolean {
  const path = pathname.split('?')[0] || pathname;
  return /\/(new|edit)(\/|$)/.test(path);
}
