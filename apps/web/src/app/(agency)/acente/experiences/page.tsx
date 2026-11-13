import { Suspense } from 'react';

import { AcenteExperiencesPage } from '@/components/features/acente-experiences/acente-experiences-page';
import { ExperiencesSkeleton } from '@/components/features/acente-experiences/experiences-skeleton';

/** Thin route — interactive island with URL searchParams. */
export default function PartnerExperiencesRoutePage() {
  return (
    <Suspense fallback={<ExperiencesSkeleton />}>
      <AcenteExperiencesPage />
    </Suspense>
  );
}
