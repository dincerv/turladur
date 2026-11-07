import type { Metadata } from 'next';

import ToursPageClient from '@/components/features/tour/tours-page-client';

export const metadata: Metadata = {
  title: 'Turlar',
  description: 'Yayınlanmış turları ara ve filtrele.',
};

/** Legacy tours UI (sidebar Filtreler + kartlar) — data from Nest catalog. */
export default function ToursPage() {
  return <ToursPageClient />;
}
