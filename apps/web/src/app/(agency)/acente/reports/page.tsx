'use client';

import { Suspense } from 'react';

import { AcenteReportsPage } from '@/components/features/acente-reports/acente-reports-page';

function ReportsFallback() {
  return (
    <div
      className="flex h-64 items-center justify-center"
      data-testid="reports-page-fallback"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsFallback />}>
      <AcenteReportsPage />
    </Suspense>
  );
}
