import type {
  StaffModuleAccess,
  StaffPermissionKey,
  StaffPermissions,
} from '@turta/shared-types';
import {
  hasStaffModuleAccess,
  normalizeStaffModuleAccess,
} from '@turta/shared-validators';

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
  return hasStaffModuleAccess(permissions, key, 'any');
}

export function canWriteStaffPermission(
  permissions: StaffPermissions | null | undefined,
  key: StaffPermissionKey,
): boolean {
  return hasStaffModuleAccess(permissions, key, 'write');
}

export function getStaffModuleAccess(
  permissions: StaffPermissions | null | undefined,
  key: StaffPermissionKey,
): StaffModuleAccess {
  if (!permissions) return { read: false, write: false };
  return normalizeStaffModuleAccess(permissions[key]);
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

/** Users CRUD — OWNER + MANAGER (AGENCY_ADMIN). */
export function hasAgencyOwnerAccess(role: string | undefined | null): boolean {
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

export function canMutateStaffPermission(
  role: string | undefined | null,
  permissions: StaffPermissions | null | undefined,
  key: StaffPermissionKey,
): boolean {
  if (hasFullPartnerAccess(role)) return true;
  if (role !== 'PARTNER_STAFF' && role !== 'AGENCY_STAFF') return false;
  return canWriteStaffPermission(permissions, key);
}
