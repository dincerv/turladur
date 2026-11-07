'use client';

import { useEffect, useState } from 'react';
import { tourCategoryLabel } from '@turta/shared-constants';

import {
  listPendingExperiences,
  listPendingTours,
  setExperienceStatusAdmin,
  setTourStatusAdmin,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

type Row = {
  id: string;
  title: string;
  partnerId: string;
  price: string;
  currency: string;
  category: string;
  status: string;
  location?: string;
};

export default function AdminToursPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<'tours' | 'experiences'>('tours');
  const [tours, setTours] = useState<Row[]>([]);
  const [experiences, setExperiences] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!accessToken) return;
    const [t, e] = await Promise.all([
      listPendingTours(accessToken),
      listPendingExperiences(accessToken),
    ]);
    setTours(t);
    setExperiences(e);
  }

  useEffect(() => {
    if (!accessToken) return;
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const rows = tab === 'tours' ? tours : experiences;

  async function setStatus(
    id: string,
    status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT',
  ) {
    if (!accessToken) return;
    setError(null);
    try {
      if (tab === 'tours') {
        await setTourStatusAdmin(id, status, accessToken);
      } else {
        await setExperienceStatusAdmin(id, status, accessToken);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">İçerik onayı</h1>
      <p className="mt-1 text-sm text-neutral-600">
        PENDING_REVIEW tur ve deneyimler
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('tours')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === 'tours'
              ? 'bg-neutral-950 text-white'
              : 'border border-neutral-300'
          }`}
        >
          Turlar ({tours.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('experiences')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === 'experiences'
              ? 'bg-neutral-950 text-white'
              : 'border border-neutral-300'
          }`}
        >
          Deneyimler ({experiences.length})
        </button>
      </div>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      ) : null}
      <ul className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {rows.length === 0 && !error ? (
          <li className="p-4 text-sm text-neutral-600">Bekleyen kayıt yok.</li>
        ) : null}
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="font-medium text-neutral-900">{row.title}</p>
              <p className="text-xs text-neutral-500">
                {tourCategoryLabel(row.category)}
                {row.location ? ` · ${row.location}` : ''} · {row.price}{' '}
                {row.currency}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
                onClick={() => void setStatus(row.id, 'PUBLISHED')}
              >
                Yayınla
              </button>
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs"
                onClick={() => void setStatus(row.id, 'DRAFT')}
              >
                Taslak
              </button>
              <button
                type="button"
                className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs font-medium text-white"
                onClick={() => void setStatus(row.id, 'ARCHIVED')}
              >
                Arşivle
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
