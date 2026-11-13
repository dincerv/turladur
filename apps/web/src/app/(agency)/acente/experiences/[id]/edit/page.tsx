import { Suspense } from 'react';

import { AcenteExperienceEditPage } from '@/components/features/acente-experiences/acente-experience-edit-page';

function EditFallback() {
  return (
    <div
      className="animate-pulse space-y-6"
      data-testid="edit-experience-skeleton"
    >
      <div className="h-8 w-56 rounded bg-neutral-200" />
      <div className="h-3 w-full rounded-full bg-neutral-200" />
      <div className="max-w-2xl space-y-4 rounded-xl border border-neutral-100 bg-white p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="h-11 w-full rounded-lg bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PartnerEditExperienceRoutePage() {
  return (
    <Suspense fallback={<EditFallback />}>
      <AcenteExperienceEditPage />
    </Suspense>
  );
}
