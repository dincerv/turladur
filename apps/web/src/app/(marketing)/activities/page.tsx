import type { Metadata } from 'next';

import ActivitiesPageClient from '@/components/features/activity/activities-page-client';

export const metadata: Metadata = {
  title: 'Aktiviteler',
  description: 'Yerel deneyimler ve aktiviteleri keşfedin.',
};

/** Legacy activities UI — Nest catalog/experiences. */
export default function ActivitiesPage() {
  return <ActivitiesPageClient />;
}
