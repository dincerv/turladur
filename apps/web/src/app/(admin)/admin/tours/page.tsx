'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  listPendingExperiences,
  listPendingTours,
  setExperienceStatusAdmin,
  setTourStatusAdmin,
} from '@/services/partner-admin';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
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
  coverUrl?: string | null;
  moderationNote?: string | null;
};

export default function AdminToursPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<'tours' | 'experiences'>('tours');
  const [tours, setTours] = useState<Row[]>([]);
  const [experiences, setExperiences] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  async function reload() {
    if (!accessToken) return;
    const [t, e] = await Promise.all([
      listPendingTours(accessToken),
      listPendingExperiences(accessToken),
    ]);
    setTours(t as Row[]);
    setExperiences(e as Row[]);
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
    note?: string,
  ) {
    if (!accessToken) return;
    setError(null);
    try {
      if (tab === 'tours') {
        await setTourStatusAdmin(id, status, accessToken, note);
      } else {
        await setExperienceStatusAdmin(id, status, accessToken, note);
      }
      setRejectId(null);
      setRejectNote('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    }
  }

  return (
    <div data-testid="admin-tours-page">
      <h1 className="text-2xl font-bold text-neutral-900">İçerik onayı</h1>
      <p className="mt-1 text-sm text-neutral-600">
        PENDING_REVIEW tur ve deneyimler — yayınlanınca katalogda görünür.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          data-testid="admin-tours-tab"
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
          data-testid="admin-experiences-tab"
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
        <p
          className="mt-4 rounded-lg bg-red-50 p-3 text-red-700"
          data-testid="admin-tours-error"
        >
          {error}
        </p>
      ) : null}
      <ul
        className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white"
        data-testid="admin-pending-list"
        data-count={String(rows.length)}
      >
        {rows.length === 0 && !error ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-pending-empty"
          >
            Bekleyen kayıt yok.
          </li>
        ) : null}
        {rows.map((row) => {
          const cover = resolveMediaUrl(row.coverUrl ?? null);
          return (
            <li
              key={row.id}
              data-testid={`admin-pending-row-${row.id}`}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="96px"
                      unoptimized={shouldUnoptimizeMedia(cover)}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                      Görsel yok
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">{row.title}</p>
                  <p className="text-xs text-neutral-500">
                    {row.category}
                    {row.location ? ` · ${row.location}` : ''} · {row.price}{' '}
                    {row.currency}
                  </p>
                  {tab === 'tours' ? (
                    <Link
                      href={`/admin/tours/${row.id}/preview`}
                      className="mt-1 inline-block text-xs font-medium text-sky-700 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Önizleme
                    </Link>
                  ) : null}
                  {rejectId === row.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Red gerekçesi (acenteye görünür)"
                        rows={2}
                        maxLength={500}
                        className="w-full max-w-md rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                        data-testid={`admin-reject-note-${row.id}`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-medium text-white"
                          onClick={() =>
                            void setStatus(row.id, 'DRAFT', rejectNote)
                          }
                          data-testid={`admin-reject-confirm-${row.id}`}
                        >
                          Taslağa gönder
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs"
                          onClick={() => {
                            setRejectId(null);
                            setRejectNote('');
                          }}
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid={`admin-publish-${row.id}`}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
                  onClick={() => void setStatus(row.id, 'PUBLISHED')}
                >
                  Yayınla
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs"
                  onClick={() => {
                    setRejectId(row.id);
                    setRejectNote('');
                  }}
                  data-testid={`admin-reject-${row.id}`}
                >
                  Reddet
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
          );
        })}
      </ul>
    </div>
  );
}
