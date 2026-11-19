'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import { FloatingCompareBar } from '@/components/features/tour/compare/floating-compare-bar';
import { TourCompareDrawer } from '@/components/features/tour/compare/tour-compare-drawer';
import { AiSearchPanel } from './ai-search-panel';

/**
 * Bottom chrome stack: compare above AI dock.
 * - / (home): corner bubble; expands on click (no persistent dock)
 * - /tours list: hero search while in view; dock after scroll past hero
 * - /tours/[id] + /activities/[id]: dock hidden (booking sheet)
 */
export function AiSearchExperience() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isToursList = pathname === '/tours';
  const hideForBooking =
    pathname.startsWith('/tours/') || pathname.startsWith('/activities/');
  const [toursHeroPast, setToursHeroPast] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);

  useEffect(() => {
    if (!isHome) setHomeOpen(false);
  }, [isHome]);

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

  useEffect(() => {
    if (!isHome || !homeOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHomeOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isHome, homeOpen]);

  const hideAiDock =
    hideForBooking || (isToursList && !toursHeroPast) || (isHome && !homeOpen);

  return (
    <>
      <div
        data-testid="bottom-chrome-stack"
        className={
          isHome && homeOpen
            ? 'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-end gap-2 px-3 pb-3 sm:px-5 sm:pb-5'
            : 'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-3 pb-3 sm:pb-5'
        }
      >
        <FloatingCompareBar />
        {hideAiDock ? null : (
          <div
            data-testid="ai-search-scroll-dock"
            className="pointer-events-auto w-full max-w-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          >
            {isHome ? (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  data-testid="ai-search-bubble-close"
                  aria-label="Turta aramasını kapat"
                  onClick={() => setHomeOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}
            <AiSearchPanel autoFocus={isHome} />
          </div>
        )}
      </div>

      {isHome && !homeOpen && !hideForBooking ? (
        <button
          type="button"
          data-testid="ai-search-bubble"
          aria-label="Turta'ya sor"
          onClick={() => setHomeOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-neutral-900/25 transition-transform hover:scale-[1.03] hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <MessageCircle className="h-4 w-4" aria-hidden />
            <Sparkles
              className="absolute -right-0.5 -top-0.5 h-3 w-3 text-amber-300"
              aria-hidden
            />
          </span>
          Turta&apos;ya sor
        </button>
      ) : null}

      <TourCompareDrawer />
    </>
  );
}
