'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Armchair, ArrowLeft } from 'lucide-react';

import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getPartnerTourById,
  listPartnerTourDates,
  type PartnerTourDateRow,
  type PartnerTourDetail,
} from '@/services/partner-admin';

import { sanitizeTourText } from './tours-query';

export function AcenteTourSeatsHubPage({ tourId }: { tourId: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [tour, setTour] = useState<PartnerTourDetail | null>(null);
  const [dates, setDates] = useState<PartnerTourDateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !tourId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [tourDetail, dateRows] = await Promise.all([
          getPartnerTourById(tourId, accessToken!),
          listPartnerTourDates(tourId, accessToken!),
        ]);
        if (cancelled) return;
        setTour(tourDetail);
        const active = dateRows.filter((d) => d.isActive);
        setDates(active);
        if (active.length === 1) {
          router.replace(ACENTE_ROUTES.tourDateSeats(tourId, active[0].id));
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message || 'Tur tarihleri yüklenemedi'
            : 'Tur tarihleri yüklenemedi',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, router, tourId]);

  if (loading) {
    return (
      <div
        className="space-y-4"
        data-testid="tour-seats-hub-loading"
        aria-busy="true"
      >
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tour-seats-hub-page">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ACENTE_ROUTES.tours}
          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Tur listesi
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Koltuk yönetimi</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {tour
            ? sanitizeTourText(tour.title, 120)
            : 'Tur tarihini seçerek koltuk haritasına gidin.'}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {!error && dates.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center"
          data-testid="tour-seats-hub-empty"
        >
          <Armchair className="mx-auto h-8 w-8 text-neutral-400" aria-hidden />
          <p className="mt-3 font-semibold text-neutral-800">
            Aktif tur tarihi yok
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Koltuk haritası için önce tur tarihleri ekleyin.
          </p>
          <Link
            href={`${ACENTE_ROUTES.tours}/${tourId}`}
            className="mt-4 inline-flex rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Tur detayına git
          </Link>
        </div>
      ) : null}

      {dates.length > 1 ? (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {dates.map((date) => {
            const label = new Date(date.startDate).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            return (
              <li key={date.id}>
                <Link
                  href={ACENTE_ROUTES.tourDateSeats(tourId, date.id)}
                  data-testid={`tour-seats-date-${date.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  <span className="font-medium text-neutral-900">{label}</span>
                  <span className="text-neutral-500">
                    {date.remainingCapacity}/{date.capacity} koltuk
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
