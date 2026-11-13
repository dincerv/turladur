import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { shouldUnoptimizeMedia } from '@/lib/media';

import { CampaignCountdown } from './campaign-countdown';
import { CampaignDiscountBadge, CampaignPrice } from './campaign-price';
import { remainingMs } from './campaigns.helpers';
import type { CampaignListItem } from './campaigns.types';

type CampaignCardProps = {
  campaign: CampaignListItem;
  priority?: boolean;
  nowMs: number;
};

export function CampaignCard({
  campaign,
  priority = false,
  nowMs,
}: CampaignCardProps) {
  const left = remainingMs(campaign.endsAt, nowMs);
  const showCountdown =
    Boolean(campaign.endsAt) && Number.isFinite(left) && left > 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={campaign.href}
        tabIndex={-1}
        aria-hidden
        className="relative aspect-[16/10] overflow-hidden bg-neutral-100"
      >
        <Image
          src={campaign.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          unoptimized={shouldUnoptimizeMedia(campaign.image)}
          className="object-cover transition duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        <div className="absolute top-3 right-3 left-3 z-10 flex flex-wrap gap-2">
          <CampaignDiscountBadge pricing={campaign.pricing} />
          {campaign.label ? (
            <span className="rounded-md border border-neutral-200/80 bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm">
              {campaign.label}
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 bottom-3 left-3 z-10 flex flex-wrap gap-2">
          <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs text-neutral-800 shadow-sm backdrop-blur-sm">
            {campaign.category}
          </span>
          <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs text-neutral-800 shadow-sm backdrop-blur-sm">
            {campaign.location}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-neutral-900">
          <Link
            href={campaign.href}
            className="transition hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            {campaign.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">
          {campaign.description}
        </p>

        {campaign.terms ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">
            {campaign.terms}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-neutral-100 pt-4">
          <CampaignPrice pricing={campaign.pricing} />
          <div className="flex shrink-0 flex-col items-end gap-2">
            {showCountdown && campaign.endsAt ? (
              <CampaignCountdown
                endsAt={campaign.endsAt}
                initialRemainingMs={left}
              />
            ) : null}
            <Link
              href={campaign.href}
              className="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              İncele
              <ArrowRight
                className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
