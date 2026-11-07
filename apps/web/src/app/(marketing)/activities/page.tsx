import type { Metadata } from 'next';

import { ACTIVITIES_LISTING_COVER_KEY } from '@turta/shared-constants';

import { ActivitiesRenewalCover } from '@/components/features/activity/activities-renewal-cover';
import ActivitiesPageClient from '@/components/features/activity/activities-page-client';
import { getPageCover } from '@/services/content';

export const metadata: Metadata = {
  title: 'Aktiviteler',
  description: 'Yerel deneyimler ve aktiviteleri keşfedin.',
};

async function loadActivitiesCoverEnabled() {
  try {
    const cover = await getPageCover(ACTIVITIES_LISTING_COVER_KEY);
    return {
      enabled: Boolean(cover.enabled),
      headline: cover.headline,
      subtitle: cover.subtitle,
    };
  } catch {
    return { enabled: false, headline: null, subtitle: null };
  }
}

/** Legacy activities UI — Nest catalog/experiences. Cover is admin opt-in. */
export default async function ActivitiesPage() {
  const cover = await loadActivitiesCoverEnabled();
  if (cover.enabled) {
    return (
      <ActivitiesRenewalCover
        headline={cover.headline}
        subtitle={cover.subtitle}
      />
    );
  }
  return <ActivitiesPageClient />;
}
