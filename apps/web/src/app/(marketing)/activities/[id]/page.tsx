import type { Metadata } from 'next';

import ActivityDetailClient from '@/components/features/activity/activity-detail-client';

export const metadata: Metadata = {
  title: 'Aktivite',
  description: 'Aktivite detayı',
};

export default function ActivityDetailPage() {
  return <ActivityDetailClient />;
}
