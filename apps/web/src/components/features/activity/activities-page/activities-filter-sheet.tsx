'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';
import { ActivitiesFilterFields } from './activities-filter-fields';
import { useActivitiesPage } from './activities-page-context';

const DESKTOP_QUERY = '(min-width: 768px)';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

interface ActivitiesFilterSheetProps {
  open: boolean;
  onClose: () => void;
  /** Trigger + popover wrapper; clicks inside it don't count as "outside". */
  containerRef: RefObject<HTMLElement | null>;
  titleId: string;
}

function SheetHeader({
  titleId,
  onClose,
}: {
  titleId: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2 md:px-5">
      <h2
        id={titleId}
        className="text-base font-semibold text-neutral-900 md:text-sm"
      >
        Filtreler
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Filtreleri kapat"
        className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:h-9 md:w-9"
      >
        <X aria-hidden className="h-5 w-5 md:h-4 md:w-4" />
      </button>
    </div>
  );
}

function SheetFooter({ onClose }: { onClose: () => void }) {
  const { resetFilters, isFiltered, totalCount, status } = useActivitiesPage();
  return (
    <div className="flex items-center gap-2 border-t border-neutral-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5">
      <button
        type="button"
        onClick={resetFilters}
        disabled={!isFiltered}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 md:min-h-10"
      >
        <Trash2 aria-hidden className="h-4 w-4" />
        Temizle
      </button>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 md:min-h-10"
      >
        {status === 'ready' ? `${totalCount} sonucu göster` : 'Uygula'}
      </button>
    </div>
  );
}

/**
 * Desktop: anchored popover. Mobile: bottom sheet portalled to <body> — the hero
 * search bar uses `backdrop-blur`, which would otherwise trap `position: fixed`.
 */
export function ActivitiesFilterSheet({
  open,
  onClose,
  containerRef,
  titleId,
}: ActivitiesFilterSheetProps) {
  const isDesktop = useIsDesktop();
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && containerRef.current?.contains(target)) return;
      onCloseRef.current();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, isDesktop, containerRef]);

  useEffect(() => {
    if (!open || isDesktop) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open, isDesktop]);

  if (!open) return null;

  if (isDesktop) {
    return (
      <div
        role="dialog"
        aria-labelledby={titleId}
        className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(36rem,calc(100vh-12rem))] w-[26rem] flex-col overflow-hidden rounded-xl border border-neutral-100/80 bg-white text-left shadow-2xl"
      >
        <SheetHeader titleId={titleId} onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <ActivitiesFilterFields />
        </div>
        <SheetFooter onClose={onClose} />
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:hidden">
      <button
        type="button"
        aria-label="Filtreleri kapat"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[2px]"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white text-left shadow-2xl outline-none animate-sheetUp"
      >
        <div
          aria-hidden
          className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-300"
        />
        <SheetHeader titleId={titleId} onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <ActivitiesFilterFields />
        </div>
        <SheetFooter onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
