'use client';

import { Suspense } from 'react';

import { AcenteFinancialsPage } from '@/components/features/acente-financials/acente-financials-page';

function FinancialsFallback() {
  return (
    <div
      className="flex h-64 items-center justify-center"
      data-testid="financials-page-fallback"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
    </div>
  );
}

export default function PartnerFinancialsPage() {
  return (
    <Suspense fallback={<FinancialsFallback />}>
      <AcenteFinancialsPage />
    </Suspense>
  );
}
