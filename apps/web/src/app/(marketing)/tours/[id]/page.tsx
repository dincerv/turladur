import type { Metadata } from 'next';

import TourDetailClient from '@/components/features/tour/tour-detail-client';

export const metadata: Metadata = {
  title: 'Tur Detayı',
  description: 'Tur detayı ve rezervasyon',
};

export default function TourDetailPage() {
  return <TourDetailClient />;
}
