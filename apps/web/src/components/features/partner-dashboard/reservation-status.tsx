'use client';

import { BadgeCheck, Clock, XCircle, CheckCircle } from 'lucide-react';

interface ReservationStatusProps {
  reservations: {
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
}

const statusItems = [
  {
    title: 'Onaylanan',
    icon: BadgeCheck,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    key: 'confirmed' as const,
  },
  {
    title: 'Bekleyen',
    icon: Clock,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    key: 'pending' as const,
  },
  {
    title: 'İptal Edilen',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    key: 'cancelled' as const,
  },
  {
    title: 'Tamamlanan',
    icon: CheckCircle,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    key: 'completed' as const,
  },
];

export function ReservationStatus({ reservations }: ReservationStatusProps) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-neutral-900 sm:text-lg">
        Rezervasyon Durumu
      </h3>
      <ul className="flex flex-1 flex-col justify-between gap-3">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.key}
              className="flex min-w-0 items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2.5"
            >
              <div
                className={`shrink-0 rounded-lg p-2 ${item.bgColor}`}
                aria-hidden
              >
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                {item.title}
              </span>
              <span className="shrink-0 text-lg font-semibold tabular-nums text-neutral-900">
                {reservations[item.key]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ReservationStatus;
