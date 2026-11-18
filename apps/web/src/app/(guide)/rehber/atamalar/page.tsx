'use client';

import { useCallback, useEffect, useState } from 'react';

import { revalidateRehberAssignments } from '@/app/(guide)/rehber/actions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  listGuideAssignments,
  respondGuideAssignment,
  type TourDateAssignmentRow,
} from '@/services/tour-date-assignment';

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

export default function RehberAtamalarPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<TourDateAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listGuideAssignments(accessToken);
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Atamalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRespond(
    assignmentId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    if (!accessToken) return;
    setBusyId(assignmentId);
    setError(null);
    try {
      await respondGuideAssignment(accessToken, assignmentId, status);
      await revalidateRehberAssignments();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Yanıt gönderilemedi');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      className="mx-auto max-w-3xl space-y-4"
      data-testid="rehber-atamalar-page"
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Atamalar</h2>
        <p className="mt-1 text-sm text-gray-600">
          Acentelerden gelen sefer davetlerini kabul veya reddedin.
        </p>
      </div>

      {loading ? <p className="text-sm text-gray-500">Yükleniyor…</p> : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500"
          data-testid="rehber-assignments-empty"
        >
          Bekleyen veya kabul edilmiş atama yok.
        </div>
      ) : null}

      <ul className="space-y-3" data-testid="rehber-assignments-list">
        {rows.map((row) => {
          const start = row.tourDate ? toDay(row.tourDate.startDate) : '—';
          const end = row.tourDate ? toDay(row.tourDate.endDate) : '—';
          const range = start === end ? start : `${start} → ${end}`;
          return (
            <li
              key={row.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              data-testid={`rehber-assignment-row-${row.id}`}
              data-status={row.status}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {row.tourDate?.tour.title ?? 'Tur'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Sefer: {range}</p>
                  <span
                    className={
                      row.status === 'PENDING'
                        ? 'mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'
                        : row.status === 'REJECTED'
                          ? 'mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800'
                          : 'mt-2 inline-flex rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800'
                    }
                    data-testid={`rehber-assignment-badge-${row.id}`}
                  >
                    {row.status === 'PENDING'
                      ? 'Beklemede'
                      : row.status === 'REJECTED'
                        ? 'Reddedildi'
                        : 'Kabul edildi'}
                  </span>
                </div>
                {row.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void handleRespond(row.id, 'REJECTED')}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      data-testid={`rehber-assignment-reject-${row.id}`}
                    >
                      Reddet
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void handleRespond(row.id, 'ACCEPTED')}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      data-testid={`rehber-assignment-accept-${row.id}`}
                    >
                      Kabul et
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
