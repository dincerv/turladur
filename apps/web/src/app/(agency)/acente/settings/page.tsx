'use client';

import { Suspense } from 'react';

import { AcenteSettingsPage } from '@/components/features/acente-settings/acente-settings-page';

function SettingsFallback() {
  return (
    <div
      className="flex h-64 items-center justify-center"
      data-testid="settings-page-fallback"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
    </div>
  );
}

export default function AgencySettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <AcenteSettingsPage />
    </Suspense>
  );
}
