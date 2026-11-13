import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CampaignsHero } from '@/components/features/campaigns/campaigns-hero';
import { CampaignsList } from '@/components/features/campaigns/campaigns-list';
import { CampaignSkeletonGrid } from '@/components/features/campaigns/campaign-skeleton';
import { CAMPAIGN_FIXTURES } from '@/components/features/campaigns/campaigns.data';
import {
  partitionCampaigns,
  toCampaignListItem,
} from '@/components/features/campaigns/campaigns.helpers';
import { LiveCampaigns } from '@/components/features/campaigns/live-campaigns';
import { FaqSection } from '@/components/features/faq/faq-section';

export const metadata: Metadata = {
  title: 'Kampanyalar | turta — Şeffaf Fiyatlı Fırsatlar',
  description:
    'turta kampanyaları: net koşullar, hesaplanmış indirim oranları ve süresi dolmuş fırsatların gizlenmesi.',
  alternates: { canonical: '/campaigns' },
};

async function CampaignsBody() {
  // Server clock — listing expiry is not client-trusting.
  const nowMs = Date.now();
  const items = CAMPAIGN_FIXTURES.map((fixture) =>
    toCampaignListItem(fixture, nowMs),
  );
  const { urgent, catalog } = partitionCampaigns(items, undefined, nowMs);

  return (
    <div className="space-y-16 md:space-y-20">
      {urgent.length > 0 ? (
        <section aria-labelledby="campaigns-urgent-heading">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2
                id="campaigns-urgent-heading"
                className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl"
              >
                Yakında bitenler
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Bitiş zamanı sunucu saatiyle doğrulanır; sayaç yalnızca kalan
                süreyi gösterir.
              </p>
            </div>
            <span className="rounded-md border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs tabular-nums text-neutral-600 sm:text-sm">
              {urgent.length} kampanya
            </span>
          </div>
          <LiveCampaigns items={urgent} nowMs={nowMs} />
        </section>
      ) : null}

      <section aria-labelledby="campaigns-all-heading">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2
              id="campaigns-all-heading"
              className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl"
            >
              Tüm kampanyalar
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Üstü çizili fiyat yalnızca gerçek karşılaştırma tutarı varken
              görünür.
            </p>
          </div>
          <span className="rounded-md border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs tabular-nums text-neutral-600 sm:text-sm">
            {catalog.length} kampanya
          </span>
        </div>
        <CampaignsList items={catalog} nowMs={nowMs} />
      </section>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-800">
      <CampaignsHero />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 md:py-16">
        <Suspense fallback={<CampaignSkeletonGrid />}>
          <CampaignsBody />
        </Suspense>
      </div>

      <FaqSection contactHref="/contact" />
    </main>
  );
}
