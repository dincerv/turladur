import { Clock, MapPin, Route as RouteIcon } from 'lucide-react';

import { formatDistanceKm, formatStopCount } from './routes-explorer.helpers';
import type { RouteListItem } from './routes-explorer.types';

type RouteMetaBadgesProps = {
  item: Pick<RouteListItem, 'distanceKm' | 'duration' | 'stops'>;
  size?: 'sm' | 'xs';
};

export function RouteMetaBadges({ item, size = 'sm' }: RouteMetaBadgesProps) {
  const distance = formatDistanceKm(item.distanceKm);
  const badges = [
    distance
      ? {
          key: 'distance',
          icon: RouteIcon,
          label: distance,
          title: 'Duraklar arası yaklaşık mesafe',
        }
      : null,
    item.duration
      ? {
          key: 'duration',
          icon: Clock,
          label: item.duration,
          title: 'Tahmini süre',
        }
      : null,
    item.stops.length > 0
      ? {
          key: 'stops',
          icon: MapPin,
          label: formatStopCount(item.stops.length),
          title: 'Durak sayısı',
        }
      : null,
  ].filter((badge) => badge !== null);

  if (badges.length === 0) return null;

  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs';
  const iconSize = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Rota özeti">
      {badges.map(({ key, icon: Icon, label, title }) => (
        <li
          key={key}
          title={title}
          className={`inline-flex max-w-full items-center gap-1 rounded-md bg-neutral-100 font-medium text-neutral-700 ${pad}`}
        >
          <Icon
            className={`${iconSize} shrink-0 text-neutral-950`}
            aria-hidden
          />
          <span className="truncate">
            <span className="sr-only">{title}: </span>
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
