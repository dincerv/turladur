'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  listAdminAuditLogs,
  type AdminAuditLogRow,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

const ACTION_FILTERS = [
  { id: '', label: 'Tüm işlemler' },
  { id: 'AGENCY_VERIFIED', label: 'Acente onay' },
  { id: 'AGENCY_REJECTED', label: 'Acente red' },
  { id: 'AGENCY_SUSPENDED', label: 'Acente askı' },
  { id: 'AGENCY_UNSUSPENDED', label: 'Acente askı kaldırma' },
  { id: 'TOUR_PUBLISHED', label: 'Tur onay' },
  { id: 'TOUR_REJECTED', label: 'Tur red' },
  { id: 'REVIEW_HIDDEN', label: 'Yorum gizleme' },
  { id: 'REVIEW_RESTORED', label: 'Yorum yayına alma' },
] as const;

function actorLabel(row: AdminAuditLogRow) {
  if (row.actorName?.trim()) return row.actorName.trim();
  if (row.actorEmail) return row.actorEmail;
  return row.actorId ?? '—';
}

export default function AdminAuditPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminAuditLogRow[]>([]);
  const [action, setAction] = useState('');
  const [actorQuery, setActorQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminAuditLogs(accessToken, {
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
        take: 150,
      });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, action, from, to]);

  const filtered = useMemo(() => {
    const q = actorQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const label = actorLabel(row).toLowerCase();
      return (
        label.includes(q) ||
        (row.actorEmail?.toLowerCase().includes(q) ?? false) ||
        (row.actorId?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, actorQuery]);

  return (
    <div data-testid="admin-audit-page">
      <h1 className="text-2xl font-bold text-neutral-900">İşlem geçmişi</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Admin paneli kritik aksiyonları — kim, ne zaman, hangi kayıt.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            data-testid={`admin-audit-filter-${f.id || 'ALL'}`}
            onClick={() => setAction(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              action === f.id
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block text-xs text-neutral-600">
          Admin ara
          <input
            type="search"
            value={actorQuery}
            onChange={(e) => setActorQuery(e.target.value)}
            placeholder="Ad veya e-posta…"
            className="mt-1 block w-56 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            data-testid="admin-audit-actor-search"
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Başlangıç
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            data-testid="admin-audit-from"
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Bitiş
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            data-testid="admin-audit-to"
          />
        </label>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-lg border px-3 py-2 text-sm"
          data-testid="admin-audit-refresh"
        >
          Yenile
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Yükleniyor…</p>
      ) : null}

      <ul
        className="mt-6 divide-y rounded-xl border bg-white"
        data-testid="admin-audit-list"
        data-count={String(filtered.length)}
      >
        {filtered.length === 0 && !loading ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-audit-empty"
          >
            Kayıt yok.
          </li>
        ) : null}
        {filtered.map((row) => (
          <li
            key={row.id}
            className="px-4 py-3 text-sm"
            data-testid={`admin-audit-row-${row.id}`}
            data-action={row.action}
            data-actor={row.actorEmail ?? row.actorId ?? ''}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">
                  {actorLabel(row)} · {row.actionLabel}
                </p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {row.entityType}
                  {row.entityLabel ? ` · ${row.entityLabel}` : ''}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
                </p>
                {row.note ? (
                  <p className="mt-1 text-xs text-amber-800">
                    Gerekçe: {row.note}
                  </p>
                ) : null}
              </div>
              <time className="shrink-0 text-xs text-neutral-500">
                {new Date(row.createdAt).toLocaleString('tr-TR')}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
