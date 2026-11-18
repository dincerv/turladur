'use client';

import { usePathname } from 'next/navigation';
import { FloatingCompareBar } from '@/components/features/tour/compare/floating-compare-bar';
import { TourCompareDrawer } from '@/components/features/tour/compare/tour-compare-drawer';
import { AiSearchPanel } from './ai-search-panel';

/**
 * Bottom chrome stack: compare above AI dock.
 * Hide dock where it fights booking chrome:
 * - /tours list: AI lives in the hero
 * - /tours/[id] + /activities/[id]: date → kişi/satın alma bottom sheet
 */
export function AiSearchExperience() {
  const pathname = usePathname();
  const hideAiDock =
    pathname === '/tours' ||
    pathname.startsWith('/tours/') ||
    pathname.startsWith('/activities/');

  return (
    <>
      <div
        data-testid="bottom-chrome-stack"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-3 pb-3 sm:pb-5"
      >
        <FloatingCompareBar />
        {hideAiDock ? null : <AiSearchPanel />}
      </div>
      <TourCompareDrawer />
    </>
  );
}
