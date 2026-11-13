import { Suspense } from 'react';

import { AcenteToursPage } from '@/components/features/acente-tours/acente-tours-page';
import { ToursSkeleton } from '@/components/features/acente-tours/tours-skeleton';

/** Thin route — interactive island with URL searchParams. */
export default function PartnerToursRoutePage() {
  return (
    <Suspense fallback={<ToursSkeleton />}>
      <AcenteToursPage />
    </Suspense>
  );
}
