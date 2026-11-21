'use client';

import { useEffect, useState } from 'react';

import {
  listAdminEntityAudit,
  type AdminAuditLogRow,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

function actorLabel(row: AdminAuditLogRow) {
  if (row.actorName?.trim()) return row.actorName.trim();
  if (row.actorEmail) return row.actorEmail;
  return row.actorId ?? 'Bilinmeyen admin';
}

/**
 * Entity-scoped admin audit timeline (Agency / Tour / …).
 */
export function AdminAuditTimeline({
  entityType,
  entityId,
  title = 'İşlem geçmişi',
}: {
  entityType: string;
  entityId: string;
  title?: string;
}) {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminAuditLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !entityId) return;
    let cancelled = false;
    setLoading(true);
    void listAdminEntityAudit(entityType, entityId, accessToken)
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, entityType, entityId]);

  return (
    <section
      className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3"
      data-testid={`admin-audit-timeline-${entityType}-${entityId}`}
    >
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      {loading ? (
        <p className="mt-2 text-xs text-neutral-500">Yükleniyor…</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-500">Henüz kayıt yok.</p>
      ) : null}
      <ol className="mt-3 space-y-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="relative border-l-2 border-neutral-300 pl-3"
            data-testid={`admin-audit-item-${row.id}`}
            data-action={row.action}
          >
            <p className="text-sm font-medium text-neutral-900">
              {actorLabel(row)} · {row.actionLabel}
            </p>
            {row.note ? (
              <p className="mt-0.5 text-xs text-amber-800">
                Gerekçe: {row.note}
              </p>
            ) : null}
            <p className="mt-0.5 text-xs text-neutral-500">
              {new Date(row.createdAt).toLocaleString('tr-TR')}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
