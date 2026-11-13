'use client';

import { useParams } from 'next/navigation';

import { AcenteTourDetailPage } from '@/components/features/acente-tours/tour-detail/acente-tour-detail-page';

export default function PartnerTourDetailRoutePage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;

  if (!tourId) return null;

  return <AcenteTourDetailPage tourId={tourId} />;
}
