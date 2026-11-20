'use client';

import { useEffect, useState } from 'react';

import {
  hideAdminReview,
  listAdminReviews,
  type AdminReviewRow,
} from '@/services/partner-admin';
import { useAuth } from '@/providers/auth-provider';

export default function AdminReviewsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload(q = query) {
    if (!accessToken) return;
    setRows(await listAdminReviews(accessToken, q || undefined));
  }

  useEffect(() => {
    if (!accessToken) return;
    void reload().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div data-testid="admin-reviews-page">
      <h1 className="text-2xl font-bold text-neutral-900">Yorum denetimi</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Uygunsuz yolcu yorumlarını veya acente yanıtlarını gizleyin
        (soft-delete).
      </p>

      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void reload().catch((err: Error) => setError(err.message));
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Yorum veya yanıt ara…"
          className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          data-testid="admin-reviews-search"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-medium text-white"
        >
          Ara
        </button>
      </form>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      <ul
        className="mt-6 divide-y rounded-xl border bg-white"
        data-testid="admin-reviews-list"
        data-count={String(rows.length)}
      >
        {rows.length === 0 ? (
          <li
            className="p-4 text-sm text-neutral-600"
            data-testid="admin-reviews-empty"
          >
            Listelenecek yorum yok.
          </li>
        ) : null}
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm"
            data-testid={`admin-review-row-${row.id}`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-amber-700">{row.rating}/5</p>
              <p className="mt-1 text-neutral-800">
                {row.comment || '—(yorum metni yok)'}
              </p>
              {row.agencyReply ? (
                <p className="mt-2 rounded-lg bg-neutral-50 p-2 text-xs text-neutral-600">
                  Acente: {row.agencyReply}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-400">
                {new Date(row.createdAt).toLocaleString('tr-TR')}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === row.id || !accessToken}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 disabled:opacity-50"
              data-testid={`admin-review-hide-${row.id}`}
              onClick={() => {
                if (!accessToken) return;
                if (!window.confirm('Bu yorum gizlensin mi?')) return;
                setBusyId(row.id);
                setError(null);
                void hideAdminReview(row.id, accessToken)
                  .then(async () => {
                    setSuccess('Yorum gizlendi');
                    await reload();
                  })
                  .catch((err: Error) => setError(err.message))
                  .finally(() => setBusyId(null));
              }}
            >
              Gizle
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
