'use client';

import { useEffect, useMemo, useState } from 'react';

import { ModerationNoteDialog } from '@/components/features/admin/moderation-note-dialog';
import {
  listAdminGuides,
  setGuideStatusAdmin,
  type AdminGuideRow,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

const STATUS_FILTERS = [
  { id: '', label: 'Tümü' },
  { id: 'PENDING', label: 'Onay Bekleyenler' },
  { id: 'VERIFIED', label: 'Onaylananlar' },
  { id: 'REJECTED', label: 'Reddedilenler' },
  { id: 'SUSPENDED', label: 'Askıda' },
] as const;

export default function AdminGuidesPage() {
  const { accessToken } = useAuth();
  const [guides, setGuides] = useState<AdminGuideRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    id: string;
    action: 'REJECTED' | 'SUSPENDED';
  } | null>(null);

  async function reload(status = statusFilter) {
    if (!accessToken) return;
    setGuides(await listAdminGuides(accessToken, status || undefined));
  }

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter((row) => {
      const name = `${row.firstName} ${row.lastName}`.toLowerCase();
      return name.includes(q) || row.email.toLowerCase().includes(q);
    });
  }, [guides, query]);

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
      await setGuideStatusAdmin(id, status, accessToken, note);
      setDialog(null);
      setSuccess(
        status === 'VERIFIED'
          ? 'Rehber onaylandı'
          : status === 'REJECTED'
            ? 'Rehber reddedildi'
            : 'Rehber askıya alındı',
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div data-testid="admin-guides-page">
      <h1 className="text-2xl font-bold text-neutral-900">Rehberler</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Rehber üyelik başvuruları. Red ve askı için gerekçe zorunlu.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            data-testid={`admin-guide-filter-${f.id || 'ALL'}`}
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
        placeholder="Ad veya e-posta ara…"
        className="mt-3 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        data-testid="admin-guide-search"
      />

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
          data-testid="admin-guide-success"
        >
          {success}
        </p>
      ) : null}

      <ul
        className="mt-6 divide-y rounded-xl border bg-white"
        data-testid="admin-guides-list"
        data-count={String(filtered.length)}
      >
        {filtered.length === 0 ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-guides-empty"
          >
            Bu filtreye uygun rehber yok.
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
                {row.moderationNote ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Not: {row.moderationNote}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {canApprove ? (
                  <button
                    type="button"
                    disabled={busy || !accessToken}
                    className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                    data-testid={`admin-guide-verify-${row.id}`}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `${row.firstName} ${row.lastName} onaylansın mı?`,
                        )
                      ) {
                        return;
                      }
                      void applyStatus(row.id, 'VERIFIED');
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
                    disabled={busy || !accessToken}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900 disabled:opacity-50"
                    data-testid={`admin-guide-suspend-${row.id}`}
                    onClick={() =>
                      setDialog({ id: row.id, action: 'SUSPENDED' })
                    }
                  >
                    Askıya al
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <ModerationNoteDialog
        open={Boolean(dialog)}
        title={
          dialog?.action === 'SUSPENDED'
            ? 'Rehberi askıya al'
            : 'Rehber başvurusunu reddet'
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
