import { notFound } from 'next/navigation';

import { AcenteDashboardPreviewClient } from './preview-client';

/** Local visual QA only — stripped from production builds. */
export default function AcenteDashboardPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <AcenteDashboardPreviewClient />;
}
