import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Clock, ImageOff, MapPin, Star } from 'lucide-react';
import MembershipBadge from '@/components/features/tour/membership-badge';
import { shouldUnoptimizeMedia } from '@/lib/media';
import { ActivityAgeBadge } from './activity-age-badge';
import { formatPriceTry } from './activities-page.helpers';
import type { Experience } from './activities-page.types';

interface ActivityListingCardProps {
  experience: Experience;
  /** Above-the-fold cards load eagerly for LCP. */
  priority?: boolean;
}

export function ActivityListingCard({
  experience,
  priority = false,
}: ActivityListingCardProps) {
  const {
    id,
    title,
    imageUrl,
    category,
    location,
    duration,
    rating,
    reviewCount,
    price,
    ageRestriction,
    ageRestrictionLabel,
    experienceOperator,
  } = experience;

  return (
    <Link
      href={`/activities/${encodeURIComponent(id)}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-100/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            unoptimized={shouldUnoptimizeMedia(imageUrl)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-sky-50 to-neutral-100 text-neutral-400">
            <ImageOff aria-hidden className="h-8 w-8" />
            <span className="text-[11px] font-medium">Görsel yakında</span>
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            {category && (
              <span className="max-w-full truncate rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow">
                {category}
              </span>
            )}
            <MembershipBadge
              tier={experienceOperator?.membershipTier}
              variant="onImage"
            />
          </div>
          {reviewCount > 0 && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm"
              aria-label={`Puan ${rating.toFixed(1)}, ${reviewCount} değerlendirme`}
            >
              <Star
                aria-hidden
                className="h-3.5 w-3.5 fill-current text-yellow-400"
              />
              <span className="text-xs font-semibold text-neutral-800">
                {rating.toFixed(1)}
              </span>
              <span className="text-[11px] text-neutral-500">
                ({reviewCount})
              </span>
            </span>
          )}
        </div>

        <ActivityAgeBadge
          restriction={ageRestriction}
          label={ageRestrictionLabel}
          className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3
          className="mb-1.5 line-clamp-2 min-h-[2.75rem] break-words text-base font-semibold leading-snug text-neutral-900 transition-colors duration-200 group-hover:text-sky-700"
          title={title}
        >
          {title}
        </h3>
        <p className="mb-1 flex min-w-0 items-center gap-1.5 text-xs text-neutral-600">
          <MapPin
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 text-neutral-400"
          />
          <span className="truncate" title={location}>
            {location}
          </span>
        </p>
        <p className="mb-3 flex min-h-[1rem] min-w-0 items-center gap-1.5 text-xs text-neutral-600">
          {duration && (
            <>
              <Clock
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 text-neutral-400"
              />
              <span className="truncate">{duration}</span>
            </>
          )}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutral-100/80 pt-3">
          {price != null ? (
            <span className="min-w-0 truncate text-lg font-bold text-sky-600 tabular-nums">
              {formatPriceTry(price)}
            </span>
          ) : (
            <span className="text-xs font-medium text-neutral-500">
              Fiyat Sorunuz
            </span>
          )}
          <span className="inline-flex shrink-0 items-center rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 group-hover:bg-sky-700">
            Detayları Gör
            <ChevronRight
              aria-hidden
              className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
