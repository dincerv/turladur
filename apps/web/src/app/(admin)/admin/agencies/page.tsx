'use client';

import { useEffect, useMemo, useState } from 'react';

import { AdminAuditTimeline } from '@/components/features/admin/admin-audit-timeline';
import { ModerationNoteDialog } from '@/components/features/admin/moderation-note-dialog';
import { listAdminPartners, setPartnerStatus } from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

type PartnerRow = {
  id: string;
  companyName: string;
  contactEmail: string;
  status: string;
  moderationNote?: string | null;
};

const STATUS_FILTERS = [
  { id: '', label: 'Tümü' },
  { id: 'PENDING', label: 'Onay Bekleyenler' },
  { id: 'VERIFIED', label: 'Onaylananlar' },
  { id: 'REJECTED', label: 'Reddedilenler' },
  { id: 'SUSPENDED', label: 'Askıda' },
] as const;

/**
 * Soft-launch: Partner (tur operatörü) onay kuyruğu.
 */
export default function AdminAgenciesPage() {
  const { accessToken } = useAuth();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    id: string;
    action: 'REJECTED' | 'SUSPENDED';
  } | null>(null);
  const [timelineId, setTimelineId] = useState<string | null>(null);

  async function reload(status = statusFilter) {
    if (!accessToken) return;
    const p = await listAdminPartners(accessToken, status || undefined);
    setPartners(p);
  }

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(
      (row) =>
        row.companyName.toLowerCase().includes(q) ||
        row.contactEmail.toLowerCase().includes(q),
    );
  }, [partners, query]);

  async function applyStatus(
    id: string,
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    note?: string,
  ) {
    if (!accessToken) return;
    setPendingId(id);
    setError(null);
    setSuccess(null);
    try {
      await setPartnerStatus(id, status, accessToken, note);
      setDialog(null);
      setSuccess(
        status === 'VERIFIED'
          ? partners.find((p) => p.id === id)?.status === 'SUSPENDED'
            ? 'Partner askısı kaldırıldı'
            : 'Partner onaylandı'
          : status === 'REJECTED'
            ? 'Partner reddedildi'
            : 'Partner askıya alındı',
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div data-testid="admin-agencies-page">
      <h1 className="text-2xl font-bold text-neutral-900">Partner onayları</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Tur operatörü / partner başvuruları. Red ve askı için gerekçe zorunlu.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            data-testid={`admin-partner-filter-${f.id || 'ALL'}`}
            onClick={() => setStatusFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === f.id
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Şirket veya e-posta ara…"
        className="mt-3 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        data-testid="admin-partner-search"
      />

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
          data-testid="admin-partner-success"
        >
          {success}
        </p>
      ) : null}

      <ul
        className="mt-6 divide-y rounded-xl border bg-white"
        data-testid="admin-partners-list"
        data-count={String(filtered.length)}
      >
        {filtered.length === 0 ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-partners-empty"
          >
            Bu filtreye uygun partner yok.
          </li>
        ) : null}
        {filtered.map((row) => {
          const status = row.status.toUpperCase();
          const canApprove = status !== 'VERIFIED';
          const canReject = status !== 'REJECTED';
          const canSuspend = status !== 'SUSPENDED';
          const busy = pendingId === row.id;

          return (
            <li
              key={row.id}
              data-testid={`admin-partner-row-${row.id}`}
              data-status={status}
              className="px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{row.companyName}</p>
                  <p className="text-xs text-neutral-500">
                    {row.contactEmail} · {row.status}
                  </p>
                  {row.moderationNote ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Not: {row.moderationNote}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid={`admin-partner-history-${row.id}`}
                    className="rounded-lg border px-2 py-1 text-xs text-neutral-700"
                    onClick={() =>
                      setTimelineId((cur) => (cur === row.id ? null : row.id))
                    }
                  >
                    {timelineId === row.id ? 'Geçmişi gizle' : 'Geçmiş'}
                  </button>
                  {canApprove ? (
                    <button
                      type="button"
                      data-testid={`admin-partner-approve-${row.id}`}
                      disabled={busy || !accessToken}
                      className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                      onClick={() => {
                        if (
                          !window.confirm(`${row.companyName} onaylansın mı?`)
                        ) {
                          return;
                        }
                        void applyStatus(row.id, 'VERIFIED');
                      }}
                    >
                      {status === 'SUSPENDED' ? 'Askıyı kaldır' : 'Onayla'}
                    </button>
                  ) : null}
                  {canReject ? (
                    <button
                      type="button"
                      data-testid={`admin-partner-reject-${row.id}`}
                      disabled={busy || !accessToken}
                      className="rounded-lg border px-2 py-1 text-xs disabled:opacity-50"
                      onClick={() =>
                        setDialog({ id: row.id, action: 'REJECTED' })
                      }
                    >
                      Red
                    </button>
                  ) : null}
                  {canSuspend ? (
                    <button
                      type="button"
                      data-testid={`admin-partner-suspend-${row.id}`}
                      disabled={busy || !accessToken}
                      className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900 disabled:opacity-50"
                      onClick={() =>
                        setDialog({ id: row.id, action: 'SUSPENDED' })
                      }
                    >
                      Askıya al
                    </button>
                  ) : null}
                </div>
              </div>
              {timelineId === row.id ? (
                <AdminAuditTimeline
                  entityType="Agency"
                  entityId={row.id}
                  title="Bu acentenin işlem geçmişi"
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <ModerationNoteDialog
        open={Boolean(dialog)}
        title={
          dialog?.action === 'SUSPENDED'
            ? 'Partneri askıya al'
            : 'Partner başvurusunu reddet'
        }
        confirmLabel={dialog?.action === 'SUSPENDED' ? 'Askıya al' : 'Reddet'}
        pending={Boolean(dialog && pendingId === dialog.id)}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onConfirm={async (note) => {
          if (!dialog) return;
          await applyStatus(dialog.id, dialog.action, note);
        }}
      />
    </div>
  );
}
