'use client';

import { useEffect, useState } from 'react';
import type { CompareToursResponse } from '@turta/shared-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getComparedTours } from '@/services/catalog';
import { useTourCompareStore } from '@/stores/tour-compare-store';
import { TourCompareMatrix } from './tour-compare-matrix';

export function TourCompareDrawer() {
  const selected = useTourCompareStore((state) => state.selected);
  const isDrawerOpen = useTourCompareStore((state) => state.isDrawerOpen);
  const closeDrawer = useTourCompareStore((state) => state.closeDrawer);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CompareToursResponse | null>(null);

  const selectedIdsKey = selected.map((item) => item.id).join(',');

  useEffect(() => {
    if (!isDrawerOpen || !selectedIdsKey) return;

    const ids = selectedIdsKey.split(',').filter(Boolean);
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const data = await getComparedTours(ids, controller.signal);
        if (!controller.signal.aborted) {
          setPayload(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setPayload(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Turlar karşılaştırılırken bir sorun oluştu.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [isDrawerOpen, selectedIdsKey]);

  return (
    <Dialog
      open={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <DialogContent
        data-testid="compare-modal"
        showCloseButton
        className="flex max-h-[min(92vh,900px)] w-[min(96vw,1120px)] max-w-[min(96vw,1120px)] flex-col gap-0 overflow-hidden rounded-2xl border-neutral-200 p-0 sm:max-w-[min(96vw,1120px)]"
        aria-describedby="compare-modal-desc"
      >
        <DialogHeader className="shrink-0 border-b border-neutral-100 px-5 py-4 text-left sm:px-6">
          <DialogTitle>Tur karşılaştırması</DialogTitle>
          <DialogDescription id="compare-modal-desc">
            Seçtiğiniz turları yan yana inceleyin. ESC ile kapatabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div
              data-testid="compare-modal-loading"
              className="flex min-h-[16rem] items-center justify-center text-sm text-neutral-500"
            >
              Karşılaştırma hazırlanıyor…
            </div>
          ) : null}

          {!loading && error ? (
            <div
              data-testid="compare-modal-error"
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {error}
            </div>
          ) : null}

          {!loading && !error && payload ? (
            <TourCompareMatrix columns={payload.columns} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
