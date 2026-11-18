'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FloatingCompareBar } from '@/components/features/tour/compare/floating-compare-bar';
import { TourCompareDrawer } from '@/components/features/tour/compare/tour-compare-drawer';
import { AiSearchPanel } from './ai-search-panel';

/**
 * Bottom chrome stack: compare above AI dock.
 * - /tours list: hero search while in view; dock after scroll past hero
 * - /tours/[id] + /activities/[id]: dock hidden (booking sheet)
 */
export function AiSearchExperience() {
  const pathname = usePathname();
  const isToursList = pathname === '/tours';
  const hideForBooking =
    pathname.startsWith('/tours/') || pathname.startsWith('/activities/');
  const [toursHeroPast, setToursHeroPast] = useState(false);

  useEffect(() => {
    if (!isToursList) {
      setToursHeroPast(false);
      return;
    }

    const update = () => {
      const hero =
        document.querySelector<HTMLElement>(
          '[data-testid="tours-page-hero"]',
        ) ?? document.querySelector<HTMLElement>('[data-ai-search-hero]');
      if (hero) {
        const bottom = hero.getBoundingClientRect().bottom;
        // Dock when hero (search) has mostly left the viewport under the header.
        setToursHeroPast(bottom < 96);
        return;
      }
      setToursHeroPast(window.scrollY > 320);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [isToursList]);

  const hideAiDock = hideForBooking || (isToursList && !toursHeroPast);

  return (
    <>
      <div
        data-testid="bottom-chrome-stack"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-3 pb-3 sm:pb-5"
      >
        <FloatingCompareBar />
        {hideAiDock ? null : (
          <div
            data-testid="ai-search-scroll-dock"
            className="pointer-events-auto w-full max-w-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          >
            <AiSearchPanel />
          </div>
        )}
      </div>
      <TourCompareDrawer />
    </>
  );
}
