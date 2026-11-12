'use client';

import { useEffect, useState } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

interface ActivityDetailActionsProps {
  activityId: string;
  title: string;
}

type ShareStatus = 'idle' | 'copied' | 'failed';

const BUTTON =
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-95 disabled:opacity-60';

export function ActivityDetailActions({
  activityId,
  title,
}: ActivityDetailActionsProps) {
  const { isExperienceFavorite, toggleExperienceFavorite, isMutating } =
    useFavorites();
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const favorite = isExperienceFavorite(activityId);

  useEffect(() => {
    if (shareStatus === 'idle') return;
    const t = window.setTimeout(() => setShareStatus('idle'), 2500);
    return () => window.clearTimeout(t);
  }, [shareStatus]);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
    } catch {
      setShareStatus('failed');
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => void toggleExperienceFavorite(activityId)}
        disabled={isMutating}
        aria-pressed={favorite}
        aria-label={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        className={BUTTON}
      >
        <Heart
          aria-hidden
          className={cn('h-5 w-5', favorite && 'fill-rose-500 text-rose-500')}
        />
      </button>
      <button
        type="button"
        onClick={() => void share()}
        aria-label="Paylaş"
        className={BUTTON}
      >
        <Share2 aria-hidden className="h-5 w-5" />
      </button>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          'pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white transition-opacity',
          shareStatus === 'idle' ? 'opacity-0' : 'opacity-100',
        )}
      >
        {shareStatus === 'copied'
          ? 'Bağlantı kopyalandı'
          : shareStatus === 'failed'
            ? 'Bağlantı kopyalanamadı'
            : ''}
      </span>
    </div>
  );
}
