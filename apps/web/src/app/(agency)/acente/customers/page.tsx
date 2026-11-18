'use client';

import { Suspense } from 'react';

import { AcenteCustomersPage } from '@/components/features/acente-customers/acente-customers-page';

function CustomersFallback() {
  return (
    <div
      className="flex h-64 items-center justify-center"
      data-testid="customers-page-fallback"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
    </div>
  );
}

export default function PartnerCustomersPage() {
  return (
    <Suspense fallback={<CustomersFallback />}>
      <AcenteCustomersPage />
    </Suspense>
  );
}
