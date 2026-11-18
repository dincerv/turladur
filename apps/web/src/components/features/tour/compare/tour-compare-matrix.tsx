'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type {
  ComparedTourAvailable,
  ComparedTourColumn,
} from '@turta/shared-types';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { tourPublicPath } from '@/lib/tours/tour-public-path';
import {
  computeCompareHighlights,
  isHighlighted,
  type CompareMetricKey,
} from './compare-highlights';

const PLACEHOLDER = 'https://placehold.co/320x200/e5e7eb/6b7280?text=Tur';

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `₺${Math.round(price).toLocaleString('tr-TR')}`;
  }
}

function highlightClass(active: boolean): string {
  return active
    ? 'rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-200'
    : '';
}

function CellValue({
  tourId,
  metric,
  highlights,
  children,
  testId,
}: {
  tourId: string;
  metric: CompareMetricKey;
  highlights: ReturnType<typeof computeCompareHighlights>;
  children: ReactNode;
  testId: string;
}) {
  const active = isHighlighted(highlights, metric, tourId);
  return (
    <div
      data-testid={testId}
      data-highlight={active ? 'true' : 'false'}
      className={highlightClass(active)}
    >
      {children}
    </div>
  );
}

function UnavailableColumn({
  column,
}: {
  column: Extract<ComparedTourColumn, { available: false }>;
}) {
  return (
    <div
      data-testid={`compare-column-${column.id}`}
      data-available="false"
      className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center"
    >
      <p className="text-sm font-medium text-neutral-800">{column.message}</p>
      <p className="mt-2 text-xs text-neutral-500">
        Bu sütun karşılaştırmaya dahil edilmedi.
      </p>
    </div>
  );
}

function AvailableHeader({ tour }: { tour: ComparedTourAvailable }) {
  const src = resolveMediaUrl(tour.coverUrl) || PLACEHOLDER;
  return (
    <div
      data-testid={`compare-column-${tour.id}`}
      data-available="true"
      className="space-y-3"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-neutral-100">
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized={shouldUnoptimizeMedia(src)}
          className="object-cover"
        />
      </div>
      <div>
        <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">
          {tour.title}
        </h3>
        {tour.partnerName ? (
          <p className="mt-1 truncate text-xs text-neutral-500">
            {tour.partnerName}
          </p>
        ) : null}
        <Link
          href={tourPublicPath(tour)}
          className="mt-2 inline-flex text-sm font-medium text-neutral-950 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
        >
          Turu incele
        </Link>
      </div>
    </div>
  );
}

type RowDef = {
  key: string;
  label: string;
  metric?: CompareMetricKey;
  render: (tour: ComparedTourAvailable) => ReactNode;
};

const ROWS: RowDef[] = [
  {
    key: 'price',
    label: 'Fiyat',
    metric: 'price',
    render: (tour) => formatPrice(tour.price, tour.currency),
  },
  {
    key: 'duration',
    label: 'Süre',
    metric: 'durationDays',
    render: (tour) => `${tour.durationDays} gün`,
  },
  {
    key: 'rating',
    label: 'Puan',
    metric: 'averageRating',
    render: (tour) =>
      tour.reviewCount > 0
        ? `${tour.averageRating.toFixed(1)} (${tour.reviewCount})`
        : 'Değerlendirme yok',
  },
  {
    key: 'accommodation',
    label: 'Konaklama',
    metric: 'hotelStars',
    render: (tour) => {
      const stars = tour.hotelStars != null ? `${tour.hotelStars}★` : null;
      const name = tour.accommodationName;
      const type = tour.accommodationType;
      if (!stars && !name && !type) return 'Belirtilmemiş';
      return [stars, name, type].filter(Boolean).join(' · ');
    },
  },
  {
    key: 'transport',
    label: 'Ulaşım',
    render: (tour) => tour.transportation || 'Belirtilmemiş',
  },
  {
    key: 'entertainment',
    label: 'Eğlence / Tempo Seviyesi',
    render: (tour) =>
      tour.entertainmentLabel ||
      (tour.entertainmentLevel === 'HIGH'
        ? 'Yüksek tempo / eğlence'
        : tour.entertainmentLevel === 'LOW'
          ? 'Sakin tempo'
          : tour.entertainmentLevel === 'MEDIUM'
            ? 'Dengeli tempo'
            : 'Belirtilmemiş'),
  },
  {
    key: 'cancellation',
    label: 'İptal Şartları',
    render: (tour) => tour.cancellationPolicy || 'Acente politikasına göre',
  },
  {
    key: 'inclusions',
    label: 'Dahil Olanlar',
    metric: 'inclusionsCount',
    render: (tour) =>
      tour.inclusions.length > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-left text-sm">
          {tour.inclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        'Belirtilmemiş'
      ),
  },
];

export function TourCompareMatrix({
  columns,
}: {
  columns: ComparedTourColumn[];
}) {
  const highlights = computeCompareHighlights(columns);
  const colCount = Math.min(Math.max(columns.length, 1), 4);
  const gridClass =
    colCount === 1
      ? 'grid-cols-1'
      : colCount === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : colCount === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div
      data-testid="compare-matrix"
      className="space-y-8"
      role="table"
      aria-label="Tur karşılaştırma matrisi"
    >
      <div className={`grid gap-4 ${gridClass}`} role="row">
        {columns.map((column) =>
          column.available ? (
            <AvailableHeader key={column.id} tour={column} />
          ) : (
            <UnavailableColumn key={column.id} column={column} />
          ),
        )}
      </div>

      {ROWS.map((row) => (
        <section key={row.key} className="space-y-3" aria-label={row.label}>
          <h4 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {row.label}
          </h4>
          <div className={`grid gap-4 ${gridClass}`} role="row">
            {columns.map((column) => {
              if (!column.available) {
                return (
                  <div
                    key={`${row.key}-${column.id}`}
                    data-testid={`compare-cell-${row.key}-${column.id}`}
                    className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3 text-sm text-neutral-400"
                    role="cell"
                  >
                    —
                  </div>
                );
              }

              const content = row.render(column);
              return (
                <div
                  key={`${row.key}-${column.id}`}
                  className="rounded-xl border border-neutral-100 bg-white px-3 py-3 text-sm text-neutral-800"
                  role="cell"
                >
                  {row.metric ? (
                    <CellValue
                      tourId={column.id}
                      metric={row.metric}
                      highlights={highlights}
                      testId={`compare-cell-${row.key}-${column.id}`}
                    >
                      {content}
                    </CellValue>
                  ) : (
                    <div data-testid={`compare-cell-${row.key}-${column.id}`}>
                      {content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
