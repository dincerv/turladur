import type { StaffPermissionKey, StaffPermissions } from '@turta/shared-types';

export function normalizeStaffPermissions(
  raw: unknown,
): StaffPermissions | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  return raw as StaffPermissions;
}

export function isStaffPermissionGranted(
  permissions: StaffPermissions | null | undefined,
  key: StaffPermissionKey,
): boolean {
  if (!permissions) return false;
  const value = permissions[key];
  if (value === true) return true;
  if (Array.isArray(value) && value.length > 0) return true;
  return false;
}

/** Partner owner / Agency owner-admin / platform admins bypass staff permission checks. */
export function hasFullPartnerAccess(role: string | undefined | null): boolean {
  return (
    role === 'PARTNER' ||
    role === 'AGENCY_OWNER' ||
    role === 'AGENCY_ADMIN' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'PLATFORM_ADMIN' ||
    role === 'PLATFORM_SUPER_ADMIN'
  );
}

/** Users CRUD — yalnızca OWNER (AGENCY_ADMIN hariç). */
export function hasAgencyOwnerAccess(role: string | undefined | null): boolean {
  return (
    role === 'PARTNER' ||
    role === 'AGENCY_OWNER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'PLATFORM_ADMIN' ||
    role === 'PLATFORM_SUPER_ADMIN'
  );
}

export function isSellerPanelRole(role: string | undefined | null): boolean {
  return (
    role === 'PARTNER' ||
    role === 'PARTNER_STAFF' ||
    role === 'AGENCY_OWNER' ||
    role === 'AGENCY_ADMIN' ||
    role === 'AGENCY_STAFF' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'PLATFORM_ADMIN' ||
    role === 'PLATFORM_SUPER_ADMIN'
  );
}

export function canAccessStaffPermission(
  role: string | undefined | null,
  permissions: StaffPermissions | null | undefined,
  key: StaffPermissionKey,
): boolean {
  if (hasFullPartnerAccess(role)) return true;
  if (role !== 'PARTNER_STAFF' && role !== 'AGENCY_STAFF') return false;
  return isStaffPermissionGranted(permissions, key);
}
