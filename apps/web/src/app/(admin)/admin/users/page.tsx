'use client';

import { useEffect, useState } from 'react';

import { listAdminUsers, updateAdminUser } from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  partnerId: string | null;
};

const ROLES = [
  'CUSTOMER',
  'PARTNER',
  'PARTNER_STAFF',
  'ADMIN',
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PLATFORM_SUPER_ADMIN',
] as const;

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!accessToken) return;
    setRows(await listAdminUsers(accessToken));
  }

  useEffect(() => {
    if (!accessToken) return;
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function patch(
    id: string,
    body: { isActive?: boolean; role?: string },
  ) {
    if (!accessToken) return;
    setError(null);
    try {
      await updateAdminUser(id, body, accessToken);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    }
  }

  return (
    <div data-testid="admin-users-page">
      <h1 className="text-2xl font-bold text-neutral-900">Kullanıcılar</h1>
      <p className="mt-1 text-sm text-neutral-600">Rol ve aktiflik yönetimi</p>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      ) : null}
      <ul
        className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white"
        data-testid="admin-users-list"
      >
        {rows.length === 0 ? (
          <li className="p-4 text-sm text-neutral-600">
            Kullanıcı bulunamadı.
          </li>
        ) : null}
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="font-medium text-neutral-900">{row.email}</p>
              <p className="text-xs text-neutral-500">
                {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}{' '}
                · {row.isActive ? 'aktif' : 'pasif'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                value={row.role}
                onChange={(e) => void patch(row.id, { role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-50"
                onClick={() => void patch(row.id, { isActive: !row.isActive })}
              >
                {row.isActive ? 'Pasifleştir' : 'Aktifleştir'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
