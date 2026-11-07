import Image from 'next/image';
import Link from 'next/link';
import type { Tour } from '@turta/shared-types';

import { resolveMediaUrl, shouldUnoptimizeMedia } from '@/lib/media';
import { getTourCategoryLabel } from '@/lib/tour-category-label';

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
  const categoryLabel = getTourCategoryLabel(tour.category);
  const href = `/tours/${tour.id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link
        href={href}
        className="relative aspect-[16/10] overflow-hidden bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-inset"
        aria-label={tour.title}
      >
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={shouldUnoptimizeMedia(coverSrc)}
            className="object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-600">
            <span className="px-3 text-center text-sm font-medium break-words">
              {categoryLabel}
            </span>
          </div>
        )}
        {tour.featured ? (
          <span className="absolute top-3 left-3 rounded-md bg-neutral-950 px-2 py-1 text-xs font-semibold text-white">
            Öne çıkan
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {categoryLabel}
        </p>
        <h3 className="line-clamp-2 text-lg leading-snug font-semibold break-words text-neutral-900">
          <Link
            href={href}
            className="transition-colors hover:text-neutral-600 focus:outline-none focus-visible:underline"
          >
            {tour.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm break-words text-neutral-600">
          {tour.description}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">{tour.durationDays} gün</p>
            <p className="truncate text-lg font-semibold text-neutral-900">
              {formatPrice(tour.price, tour.currency)}
            </p>
          </div>
          <Link
            href={href}
            className="shrink-0 rounded-lg bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            İncele
          </Link>
        </div>
      </div>
    </article>
  );
}
