import Image from 'next/image';
import Link from 'next/link';
import { tourCategoryLabel } from '@turta/shared-constants';
import type { Tour } from '@turta/shared-types';
import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';

function formatPrice(price: string, currency: string) {
  const value = Number(price);
  if (Number.isNaN(value)) return `${price} ${currency}`;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

export function TourCard({ tour }: { tour: Tour }) {
  const coverSrc = resolveMediaUrl(tour.coverUrl);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={tour.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={shouldUnoptimizeMedia(coverSrc)}
            className="object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-700">
            <span className="text-sm font-medium">
              {tourCategoryLabel(tour.category)}
            </span>
          </div>
        )}
        {tour.featured ? (
          <span className="absolute left-3 top-3 rounded-md bg-neutral-950 px-2 py-1 text-xs font-semibold text-white">
            Öne çıkan
          </span>
        ) : null}{' '}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {tourCategoryLabel(tour.category)}
        </p>
        <h3 className="text-lg font-semibold text-neutral-900">
          <Link href={`/tours/${tour.id}`} className="hover:text-neutral-600">
            {tour.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-neutral-600">
          {tour.description}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-xs text-neutral-500">{tour.durationDays} gün</p>
            <p className="text-lg font-semibold text-neutral-900">
              {formatPrice(tour.price, tour.currency)}
            </p>
          </div>
          <Link
            href={`/tours/${tour.id}`}
            className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            İncele
          </Link>
        </div>
      </div>
    </article>
  );
}
