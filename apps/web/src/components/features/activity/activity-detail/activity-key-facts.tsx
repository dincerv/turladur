import { Clock, MapPin, ShieldAlert, Star, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAdultOnly } from '../activities-page/activity-age';
import type { ActivityDetail } from './activity-detail.types';

interface Fact {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'neutral' | 'alert';
}

function buildFacts(a: ActivityDetail): Fact[] {
  const facts: Fact[] = [];
  if (a.duration) {
    facts.push({
      key: 'duration',
      icon: Clock,
      label: 'Süre',
      value: a.duration,
      tone: 'neutral',
    });
  }
  if (a.ageRestrictionLabel) {
    const adult = isAdultOnly(a.ageRestriction);
    facts.push({
      key: 'age',
      icon: adult ? ShieldAlert : Users,
      label: 'Yaş sınırı',
      value: a.ageRestrictionLabel,
      tone: adult ? 'alert' : 'neutral',
    });
  }
  if (a.location) {
    facts.push({
      key: 'location',
      icon: MapPin,
      label: 'Konum',
      value: a.location,
      tone: 'neutral',
    });
  }
  if (a.reviewCount > 0) {
    facts.push({
      key: 'rating',
      icon: Star,
      label: 'Puan',
      value: `${a.rating.toFixed(1)} (${a.reviewCount} değerlendirme)`,
      tone: 'neutral',
    });
  }
  return facts;
}

/** Single source for duration / age / location / rating — not repeated elsewhere. */
export function ActivityKeyFacts({ activity }: { activity: ActivityDetail }) {
  const facts = buildFacts(activity);
  if (facts.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-2">
      {facts.map(({ key, icon: Icon, label, value, tone }) => (
        <div
          key={key}
          className={cn(
            'inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
            tone === 'alert'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-neutral-200 bg-white text-neutral-800',
          )}
        >
          <Icon
            aria-hidden
            className={cn(
              'h-4 w-4 shrink-0',
              tone === 'alert' ? 'text-rose-600' : 'text-sky-600',
              key === 'rating' && 'fill-current text-amber-400',
            )}
          />
          <dt className="sr-only">{label}</dt>
          <dd
            className={cn(
              'min-w-0 truncate',
              tone === 'alert' ? 'font-bold' : 'font-medium',
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
