'use client';

import { AcenteDashboardView } from '@/components/features/acente-dashboard/acente-dashboard-view';
import { DashboardSkeleton } from '@/components/features/acente-dashboard/dashboard-skeleton';
import { ACENTE_DASHBOARD_FIXTURE } from '@/components/features/acente-dashboard/fixtures';

export function AcenteDashboardPreviewClient() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      <p className="mb-4 text-xs font-medium tracking-wide text-amber-700">
        DEV PREVIEW — fixture data (auth yok)
      </p>
      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold text-neutral-700">Skeleton</p>
        <DashboardSkeleton />
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-700">
          Loaded state
        </p>
        <AcenteDashboardView {...ACENTE_DASHBOARD_FIXTURE} />
      </div>
    </main>
  );
}
