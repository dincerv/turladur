import Image from 'next/image';
import { ExternalLink, MapPin, Star } from 'lucide-react';
import MembershipBadge from '@/components/features/tour/membership-badge';
import { shouldUnoptimizeMedia } from '@/lib/media';
import type {
  ActivityMeetingPoint,
  ActivityOperator,
  ActivityScheduleItem,
} from './activity-detail.types';

export function ActivitySchedule({
  items,
}: {
  items: readonly ActivityScheduleItem[];
}) {
  if (items.length === 0) return null;
  return (
    <ol className="relative space-y-5 border-l-2 border-sky-100 pl-6">
      {items.map((item, i) => (
        <li
          key={`${i}-${item.time}-${item.activity}`}
          className="relative min-w-0"
        >
          <span
            aria-hidden
            className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 ring-2 ring-sky-100"
          />
          {item.time ? (
            <time className="block text-xs font-semibold uppercase tracking-wide text-sky-700 tabular-nums">
              {item.time}
            </time>
          ) : null}
          <p className="mt-0.5 max-w-prose break-words text-[15px] leading-6 text-neutral-800 [overflow-wrap:anywhere]">
            {item.activity}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function ActivityMeetingPointCard({
  point,
}: {
  point: ActivityMeetingPoint;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <div className="min-w-0">
          <p className="break-words font-medium text-neutral-900 [overflow-wrap:anywhere]">
            {point.label}
          </p>
          {point.address ? (
            <p className="mt-0.5 break-words text-sm text-neutral-600 [overflow-wrap:anywhere]">
              {point.address}
            </p>
          ) : null}
        </div>
      </div>
      <a
        href={point.mapUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
      >
        Haritada aç
        <ExternalLink aria-hidden className="h-4 w-4" />
      </a>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');
}

export function ActivityOperatorCard({
  operator,
}: {
  operator: ActivityOperator;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sky-50">
        {operator.logoUrl ? (
          <Image
            src={operator.logoUrl}
            alt={operator.companyName}
            fill
            sizes="56px"
            unoptimized={shouldUnoptimizeMedia(operator.logoUrl)}
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center text-lg font-bold text-sky-700"
          >
            {initials(operator.companyName)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p
          className="truncate font-semibold text-neutral-900"
          title={operator.companyName}
        >
          {operator.companyName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <MembershipBadge tier={operator.membershipTier} />
          {operator.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star
                aria-hidden
                className="h-4 w-4 fill-current text-amber-400"
              />
              <span className="font-medium text-neutral-800">
                {operator.rating.toFixed(1)}
              </span>
              <span>({operator.reviewCount} değerlendirme)</span>
            </span>
          ) : (
            <span>Henüz değerlendirme yok</span>
          )}
        </div>
      </div>
    </div>
  );
}
