'use client';

import { Suspense } from 'react';

import { AcenteReviewsPage } from '@/components/features/acente-reviews/acente-reviews-page';

function ReviewsFallback() {
  return (
    <div
      className="flex h-64 items-center justify-center"
      data-testid="reviews-page-fallback"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
    </div>
  );
}

export default function AgencyReviewsPage() {
  return (
    <Suspense fallback={<ReviewsFallback />}>
      <AcenteReviewsPage />
    </Suspense>
  );
}
