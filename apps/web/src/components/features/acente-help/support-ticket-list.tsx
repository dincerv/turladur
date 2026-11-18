'use client';

import type { PartnerSupportTicket } from '@/services/partner-admin';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Açık',
  ANSWERED: 'Yanıtlandı',
  CLOSED: 'Kapandı',
};

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-900',
  ANSWERED: 'bg-sky-100 text-sky-900',
  CLOSED: 'bg-neutral-100 text-neutral-700',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

type SupportTicketListProps = {
  items: PartnerSupportTicket[];
  loading?: boolean;
};

export function SupportTicketList({
  items,
  loading = false,
}: SupportTicketListProps) {
  if (loading) {
    return (
      <div
        className="h-32 animate-pulse rounded-xl border border-gray-100 bg-white"
        data-testid="help-ticket-list-skeleton"
      />
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500"
        data-testid="help-ticket-empty"
      >
        Henüz destek talebiniz yok.
      </div>
    );
  }

  return (
    <ul className="space-y-3" data-testid="help-ticket-list">
      {items.map((ticket) => (
        <li
          key={ticket.id}
          data-testid={`help-ticket-row-${ticket.id}`}
          data-status={ticket.status}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {ticket.message}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                STATUS_CLASS[ticket.status] ?? STATUS_CLASS.OPEN
              }`}
              data-testid="help-ticket-status"
            >
              {STATUS_LABEL[ticket.status] ?? ticket.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
            <span>
              Öncelik: {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
            </span>
            {ticket.category ? <span>Kategori: {ticket.category}</span> : null}
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
