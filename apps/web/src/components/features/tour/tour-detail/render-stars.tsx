'use client';

import { Star as StarIcon } from 'lucide-react';
import { Star as StarIconSolid } from 'lucide-react';

/** Split from tour-detail-client.tsx (Faz 7) — star rating UI. */
export function renderStars(rating: number, size: 'sm' | 'md' = 'md') {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  const filled = `${starSize} fill-current text-amber-400`;
  const empty = `${starSize} fill-none text-neutral-300`;
  return (
    <div className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => {
        return star <= Math.floor(rating) ? (
          <StarIconSolid key={star} className={filled} />
        ) : star <= rating ? (
          <div key={star} className="relative">
            <StarIcon className={empty} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${(rating % 1) * 100}%` }}
            >
              <StarIconSolid className={filled} />
            </div>
          </div>
        ) : (
          <StarIcon key={star} className={empty} />
        );
      })}
    </div>
  );
}
