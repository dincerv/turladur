import { ShieldAlert, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAdultOnly } from './activity-age';
import type { AgeRestriction } from './activities-page.types';

interface ActivityAgeBadgeProps {
  restriction: AgeRestriction | null;
  label: string | null;
  className?: string;
}

export function ActivityAgeBadge({
  restriction,
  label,
  className,
}: ActivityAgeBadgeProps) {
  if (!restriction || !label) return null;
  const adult = isAdultOnly(restriction);
  const Icon = adult ? ShieldAlert : Users;

  return (
    <span
      role="img"
      aria-label={`Yaş sınırı: ${label}`}
      title={adult ? `Yalnızca ${label} katılımcılar` : `Yaş sınırı: ${label}`}
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none tracking-wide shadow-md ring-1 backdrop-blur-md',
        adult
          ? 'bg-neutral-950/85 text-white ring-rose-400/60'
          : 'bg-white/90 text-neutral-900 ring-black/5',
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          adult ? 'text-rose-400' : 'text-sky-600',
        )}
      />
      <span className="truncate tabular-nums">{label}</span>
    </span>
  );
}
