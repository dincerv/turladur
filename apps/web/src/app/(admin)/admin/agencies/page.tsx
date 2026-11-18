'use client';

import { useEffect, useState } from 'react';

import { listAdminPartners, setPartnerStatus } from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

/**
 * Soft-launch: Partner (tur operatörü) onay kuyruğu.
 * Legacy B2B Agency tablosu / sekmesi kullanılmıyor — schema drop sonraki sprint.
 */
export default function AdminAgenciesPage() {
  const { accessToken } = useAuth();
  const [partners, setPartners] = useState<
    Array<{
      id: string;
      companyName: string;
      contactEmail: string;
      status: string;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function reload() {
    if (!accessToken) return;
    const p = await listAdminPartners(accessToken);
    setPartners(p);
  }

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div data-testid="admin-agencies-page">
      <h1 className="text-2xl font-bold text-neutral-900">Partner onayları</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Tur operatörü / partner başvuruları. Onaylanan hesaplar partner paneline
        giriş yapabilir.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul
        className="mt-6 divide-y rounded-xl border bg-white"
        data-testid="admin-partners-list"
        data-count={String(partners.length)}
      >
        {partners.length === 0 ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-partners-empty"
          >
            Bekleyen veya listelenecek partner yok.
          </li>
        ) : null}
        {partners.map((row) => {
          const status = row.status.toUpperCase();
          const canApprove = status !== 'VERIFIED';
          const canReject = status !== 'REJECTED';
          const busy = pendingId === row.id;

          return (
            <li
              key={row.id}
              data-testid={`admin-partner-row-${row.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{row.companyName}</p>
                <p className="text-xs text-neutral-500">
                  {row.contactEmail} · {row.status}
                </p>
              </div>
              <div className="flex gap-2">
                {canApprove ? (
                  <button
                    type="button"
                    data-testid={`admin-partner-approve-${row.id}`}
                    disabled={busy || !accessToken}
                    className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                    onClick={() => {
                      if (!accessToken) return;
                      setPendingId(row.id);
                      void setPartnerStatus(row.id, 'VERIFIED', accessToken)
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
                    onClick={() => {
                      if (!accessToken) return;
                      setPendingId(row.id);
                      void setPartnerStatus(row.id, 'REJECTED', accessToken)
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
