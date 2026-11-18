'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getAdminTourPreview,
  type AdminTourPreview,
} from '@/services/partner-admin';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { useAuth } from '@/providers/auth-provider';

export default function AdminTourPreviewPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : String(params.id ?? '');
  const [tour, setTour] = useState<AdminTourPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !id) return;
    let cancelled = false;
    setLoading(true);
    void getAdminTourPreview(id, accessToken)
      .then((data) => {
        if (!cancelled) {
          setTour(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Tur yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  const cover = resolveMediaUrl(tour?.coverUrl ?? null);
  const gallery = (tour?.galleryUrls ?? [])
    .map((url) => resolveMediaUrl(url))
    .filter((url): url is string => Boolean(url));

  return (
    <div
      className="mx-auto max-w-3xl space-y-6"
      data-testid="admin-tour-preview"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/tours"
            className="text-sm text-neutral-600 hover:underline"
          >
            ← İçerik onayı
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">
            Tur önizleme
          </h1>
          <p className="mt-1 text-sm text-amber-800">
            Bu sayfa yalnızca admin içindir. Yayınlanmamış turlar katalogda
            görünmez.
          </p>
        </div>
        {tour ? (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            {tour.status}
          </span>
        ) : null}
      </div>

      {loading ? <p className="text-sm text-neutral-500">Yükleniyor…</p> : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {tour ? (
        <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="relative aspect-[16/9] bg-neutral-100">
            {cover ? (
              <Image
                src={cover}
                alt={tour.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                unoptimized={shouldUnoptimizeMedia(cover)}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                Görsel yok
              </div>
            )}
          </div>
          <div className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {tour.title}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {tour.category} · {tour.price} {tour.currency} ·{' '}
                {tour.durationDays} gün
                {tour.agency?.companyName
                  ? ` · ${tour.agency.companyName}`
                  : ''}
              </p>
              {tour.departureCities.length ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Kalkış: {tour.departureCities.join(', ')}
                </p>
              ) : null}
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-neutral-800">
              {tour.description}
            </div>
            {tour.moderationNote ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Son red notu: {tour.moderationNote}
              </div>
            ) : null}
            {gallery.length ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-neutral-900">
                  Galeri
                </h3>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {gallery.map((url) => (
                    <li
                      key={url}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="200px"
                        unoptimized={shouldUnoptimizeMedia(url)}
                        className="object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}
