'use client';

import { useEffect, useState } from 'react';

import {
  listAdminGuides,
  setGuideStatusAdmin,
  type AdminGuideRow,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

export default function AdminGuidesPage() {
  const { accessToken } = useAuth();
  const [guides, setGuides] = useState<AdminGuideRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function reload() {
    if (!accessToken) return;
    const rows = await listAdminGuides(accessToken);
    setGuides(rows);
  }

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div data-testid="admin-guides-page">
      <h1 className="text-2xl font-bold text-neutral-900">Rehberler</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Rehber üyelik başvuruları. Onaylanan rehberler acente sefer
        görevlendirmesinde görünür.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul
        className="mt-6 divide-y rounded-xl border bg-white"
        data-testid="admin-guides-list"
        data-count={String(guides.length)}
      >
        {guides.length === 0 ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-guides-empty"
          >
            Listelenecek rehber yok.
          </li>
        ) : null}
        {guides.map((row) => {
          const status = row.status.toUpperCase();
          const canApprove = status !== 'VERIFIED';
          const canReject = status !== 'REJECTED';
          const busy = pendingId === row.id;

          return (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm"
              data-testid={`admin-guide-row-${row.id}`}
              data-email={row.email}
              data-status={status}
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {row.firstName} {row.lastName}
                </p>
                <p className="text-xs text-neutral-500">
                  {row.email} · {row.status}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  TCKN: {row.identityNumber}
                  {row.city ? ` · ${row.city}` : ''}
                </p>
                <p className="text-xs text-neutral-500">
                  {(row.languages ?? []).join(', ') || 'Dil yok'}
                  {row.oda ? ` · Oda: ${row.oda}` : ''}
                  {row.sicilNo ? ` · Sicil: ${row.sicilNo}` : ''}
                </p>
                <p className="text-xs text-neutral-500">
                  {row.ruhsatNo ? `Ruhsat: ${row.ruhsatNo}` : ''}
                  {row.ruhsatExpiresAt
                    ? ` · Geçerlilik: ${row.ruhsatExpiresAt}`
                    : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {canApprove ? (
                  <button
                    type="button"
                    disabled={busy || !accessToken}
                    className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                    data-testid={`admin-guide-verify-${row.id}`}
                    onClick={() => {
                      if (!accessToken) return;
                      setPendingId(row.id);
                      void setGuideStatusAdmin(row.id, 'VERIFIED', accessToken)
                        .then(reload)
                        .catch((err: Error) => setError(err.message))
                        .finally(() => setPendingId(null));
                    }}
                  >
                    Onayla
                  </button>
                ) : null}
                {canReject ? (
                  <button
                    type="button"
                    disabled={busy || !accessToken}
                    className="rounded-lg border px-2 py-1 text-xs disabled:opacity-50"
                    data-testid={`admin-guide-reject-${row.id}`}
                    onClick={() => {
                      if (!accessToken) return;
                      setPendingId(row.id);
                      void setGuideStatusAdmin(row.id, 'REJECTED', accessToken)
                        .then(reload)
                        .catch((err: Error) => setError(err.message))
                        .finally(() => setPendingId(null));
                    }}
                  >
                    Red
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
