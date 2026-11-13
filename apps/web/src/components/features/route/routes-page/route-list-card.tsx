'use client';

import { memo, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Crosshair,
  Image as ImageIcon,
  MapPin,
  Star,
} from 'lucide-react';

import { shouldUnoptimizeMedia } from '@/lib/media';

import { RouteMetaBadges } from './route-meta-badges';
import { formatRating } from './routes-explorer.helpers';
import type { RouteListItem } from './routes-explorer.types';

type RouteListCardProps = {
  item: RouteListItem;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  /** Explicit "show on map" action; on mobile it also switches to the map tab. */
  onLocate: (id: string) => void;
  onHover: (id: string | null) => void;
  registerRef: (id: string, node: HTMLElement | null) => void;
  priority?: boolean;
};

function RouteListCardBase({
  item,
  isSelected,
  isHovered,
  onSelect,
  onLocate,
  onHover,
  registerRef,
  priority = false,
}: RouteListCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const rating = formatRating(item.avgRating);
  const hasGeo = item.path.length > 0;

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a,button')) return;
    if (hasGeo) onSelect(item.id);
  };

  const stateClass = isSelected
    ? 'border-neutral-950 ring-2 ring-neutral-950 shadow-md'
    : isHovered
      ? 'border-neutral-400 shadow-md'
      : 'border-neutral-200 shadow-sm';

  return (
    <article
      ref={(node) => registerRef(item.id, node)}
      onClick={handleCardClick}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      aria-current={isSelected ? 'true' : undefined}
      className={`group flex scroll-mt-28 overflow-hidden rounded-xl border bg-white transition ${stateClass} ${
        hasGeo ? 'cursor-pointer' : ''
      }`}
    >
      <Link
        href={item.href}
        tabIndex={-1}
        aria-hidden
        className="relative aspect-[4/3] w-32 shrink-0 self-stretch overflow-hidden bg-neutral-100 sm:w-44"
      >
        {item.image && !imageFailed ? (
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(max-width: 640px) 128px, 176px"
            priority={priority}
            unoptimized={shouldUnoptimizeMedia(item.image)}
            onError={() => setImageFailed(true)}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-neutral-400">
            <ImageIcon className="h-6 w-6" aria-hidden />
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-900">
          {item.tourCount} tur
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {item.categoryLabel}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-neutral-950">
            <Link href={item.href} className="hover:underline">
              {item.name}
            </Link>
          </h3>
          {item.location ? (
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-neutral-500">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{item.location}</span>
            </p>
          ) : null}
        </div>

        {item.description ? (
          <div className="hidden sm:block">
            <p className="line-clamp-2 text-sm text-neutral-600">
              {item.description}
            </p>
          </div>
        ) : null}

        <RouteMetaBadges item={item} />

        {item.priceRange ? (
          <p className="text-xs font-semibold text-neutral-900">
            {item.priceRange}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="min-w-0 text-xs text-neutral-600">
            {rating ? (
              <span className="inline-flex items-center gap-1">
                <Star
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  aria-hidden
                />
                <span className="font-semibold text-neutral-900">{rating}</span>
                <span className="sr-only">/ 5 puan</span>
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {hasGeo ? (
              <button
                type="button"
                onClick={() => onLocate(item.id)}
                aria-pressed={isSelected}
                aria-label={`${item.name} rotasını haritada göster`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
              >
                <Crosshair className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <Link
              href={item.href}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              Keşfet
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export const RouteListCard = memo(RouteListCardBase);
