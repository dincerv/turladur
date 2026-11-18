import type { Metadata } from 'next';

import ToursPageClient from '@/components/features/tour/tours-page-client';

export const metadata: Metadata = {
  title: 'Turlar',
  description:
    'Yayınlanmış turları ara, filtrele ve karşılaştır — yurtiçi ve yurtdışı seçenekler.',
  alternates: { canonical: '/tours' },
  openGraph: {
    title: 'Turlar | turta',
    description:
      'Yayınlanmış turları ara, filtrele ve karşılaştır — yurtiçi ve yurtdışı seçenekler.',
    type: 'website',
    url: '/tours',
  },
};

/** Legacy tours UI (sidebar Filtreler + kartlar) — data from Nest catalog. */
export default function ToursPage() {
  return <ToursPageClient />;
}
