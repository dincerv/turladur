'use client';

import type { AgencyStaffUiRole } from '@turta/shared-validators';
import { mapAgencyStaffRoleToUi } from '@turta/shared-validators';

import { cn } from '@/lib/utils';

const ROLE_LABEL: Record<AgencyStaffUiRole, string> = {
  OWNER: 'Sahip',
  MANAGER: 'Yönetici',
  AGENT: 'Personel',
};

const ROLE_CLASS: Record<AgencyStaffUiRole, string> = {
  OWNER: 'bg-amber-100 text-amber-900 ring-amber-200',
  MANAGER: 'bg-sky-100 text-sky-900 ring-sky-200',
  AGENT: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
};

export function resolveUiRole(
  role: string,
  uiRole?: string,
): AgencyStaffUiRole {
  if (uiRole === 'OWNER' || uiRole === 'MANAGER' || uiRole === 'AGENT') {
    return uiRole;
  }
  return mapAgencyStaffRoleToUi(role);
}

export function RoleBadge({
  role,
  uiRole,
  className,
}: {
  role: string;
  uiRole?: string;
  className?: string;
}) {
  const resolved = resolveUiRole(role, uiRole);
  return (
    <span
      data-testid="staff-role-badge"
      data-role={resolved}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        ROLE_CLASS[resolved],
        className,
      )}
    >
      {ROLE_LABEL[resolved]}
    </span>
  );
}

export { ROLE_LABEL };
