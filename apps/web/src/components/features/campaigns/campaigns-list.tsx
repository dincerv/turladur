import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { CampaignCard } from './campaign-card';
import type { CampaignListItem } from './campaigns.types';

type CampaignsListProps = {
  items: CampaignListItem[];
  nowMs: number;
  emptyTitle?: string;
  emptyHint?: string;
};

export function CampaignsList({
  items,
  nowMs,
  emptyTitle = 'Şu an aktif kampanya yok',
  emptyHint = 'Yeni kampanyalar eklendiğinde burada görünecek.',
}: CampaignsListProps) {
  if (items.length === 0) {
    return (
      <div
        role="status"
        className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-6 py-16 text-center"
      >
        <Sparkles className="mb-4 h-10 w-10 text-neutral-400" aria-hidden />
        <p className="mb-2 text-base font-semibold text-neutral-900">
          {emptyTitle}
        </p>
        <p className="mb-6 max-w-sm text-sm text-neutral-500">{emptyHint}</p>
        <Link
          href="/tours"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Turlara göz at
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((campaign, index) => (
        <li key={campaign.id} className="h-full">
          <CampaignCard
            campaign={campaign}
            priority={index < 3}
            nowMs={nowMs}
          />
        </li>
      ))}
    </ul>
  );
}
