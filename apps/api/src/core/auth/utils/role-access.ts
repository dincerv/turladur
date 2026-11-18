import { Role } from '@turta/shared-constants';

/** Platform operasyon / süper yönetici — tüm seller kaynaklarına erişebilir. */
export const PLATFORM_ADMIN_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.SUPER_ADMIN,
  Role.PLATFORM_ADMIN,
  Role.PLATFORM_SUPER_ADMIN,
] as const;

/**
 * Acente paneli + legacy PARTNER* + platform admin.
 * URL/FE gizleme yetki değildir — Nest `@Roles` + service ownership zorunlu.
 */
export const AGENCY_SELLER_ROLES: readonly Role[] = [
  Role.PARTNER,
  Role.PARTNER_STAFF,
  Role.AGENCY_OWNER,
  Role.AGENCY_ADMIN,
  Role.AGENCY_STAFF,
  ...PLATFORM_ADMIN_ROLES,
] as const;

/** Reports / owner menu — OWNER + MANAGER (AGENCY_ADMIN) only; staff excluded. */
export const AGENCY_REPORTS_MANAGER_ROLES: readonly Role[] = [
  Role.PARTNER,
  Role.AGENCY_OWNER,
  Role.AGENCY_ADMIN,
  ...PLATFORM_ADMIN_ROLES,
] as const;

/**
 * Users CRUD — OWNER + MANAGER (AGENCY_ADMIN) + legacy PARTNER + platform.
 * AGENT (AGENCY_STAFF) excluded.
 */
export const AGENCY_OWNER_ONLY_ROLES: readonly Role[] = [
  Role.PARTNER,
  Role.AGENCY_OWNER,
  Role.AGENCY_ADMIN,
  ...PLATFORM_ADMIN_ROLES,
] as const;

const PLATFORM_ADMIN_ROLE_SET = new Set<string>(PLATFORM_ADMIN_ROLES);
const AGENCY_SELLER_ROLE_SET = new Set<string>(AGENCY_SELLER_ROLES);
const AGENCY_TENANT_ROLE_SET = new Set<string>([
  Role.PARTNER,
  Role.PARTNER_STAFF,
  Role.AGENCY_OWNER,
  Role.AGENCY_ADMIN,
  Role.AGENCY_STAFF,
]);

export function isPlatformAdminRole(role: string | undefined | null): boolean {
  return Boolean(role && PLATFORM_ADMIN_ROLE_SET.has(role));
}

/** JWT rolü acente tenant aktörü mü (platform admin hariç). */
export function isAgencyTenantRole(role: string | undefined | null): boolean {
  return Boolean(role && AGENCY_TENANT_ROLE_SET.has(role));
}

export function isAgencySellerRole(role: string | undefined | null): boolean {
  return Boolean(role && AGENCY_SELLER_ROLE_SET.has(role));
}

/**
 * Soft-delete / audit aktör id: AgencyStaff.id tercih, yoksa User.id.
 */
export function resolveActorId(actor: {
  userId?: string | null;
  agencyStaffId?: string | null;
  guideId?: string | null;
  busCompanyId?: string | null;
}): string | undefined {
  return (
    actor.agencyStaffId ??
    actor.guideId ??
    actor.busCompanyId ??
    actor.userId ??
    undefined
  );
}
