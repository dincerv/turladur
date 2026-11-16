'use client';

import type { TourCompareSelection } from '@/stores/tour-compare-store';
import { CompactCompareButton } from './compact-compare-button';

/** Card overlay — compact pill (icon + short label). */
export function TourCompareSelectButton({
  tour,
}: {
  tour: TourCompareSelection;
}) {
  return (
    <div className="absolute top-14 right-2 z-10">
      <CompactCompareButton tour={tour} />
    </div>
  );
}
