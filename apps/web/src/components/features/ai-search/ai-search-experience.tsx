'use client';

import { usePathname } from 'next/navigation';
import { FloatingCompareBar } from '@/components/features/tour/compare/floating-compare-bar';
import { TourCompareDrawer } from '@/components/features/tour/compare/tour-compare-drawer';
import { AiSearchPanel } from './ai-search-panel';

/**
 * Bottom chrome stack: compare above AI dock.
 * On /tours the AI search lives in the page hero — dock is hidden to avoid duplicate UI.
 */
export function AiSearchExperience() {
  const pathname = usePathname();
  const hideAiDock = pathname === '/tours';

  return (
    <>
      <div
        data-testid="bottom-chrome-stack"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-3 pb-3 sm:pb-5"
      >
        <FloatingCompareBar />
        {hideAiDock ? null : <AiSearchPanel />}
      </div>
      <TourCompareDrawer />
    </>
  );
}
