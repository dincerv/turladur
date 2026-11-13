import type { PartnerReservation, PartnerTour } from '@/services/partner-admin';

import type {
  DashboardPopularTour,
  DashboardRecentReservation,
  DashboardReservationStatus,
  DashboardRevenueChartData,
  DashboardStatusCounts,
} from './types';

/** Strip tags/control chars before rendering user-influenced strings. */
export function sanitizeDisplayText(raw: string, max = 120): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function statusLabel(status: string): DashboardReservationStatus {
  switch (status) {
    case 'CONFIRMED':
      return 'Onaylandı';
    case 'PENDING':
    case 'PENDING_PAYMENT':
      return 'Beklemede';
    case 'CANCELLED':
      return 'İptal Edildi';
    case 'COMPLETED':
      return 'Tamamlandı';
    case 'SUSPENDED':
      return 'Askıya Alındı';
    default:
      return 'Beklemede';
  }
}

export function mapRecentReservations(
  rows: PartnerReservation[],
  hideAmounts = false,
): DashboardRecentReservation[] {
  return rows.slice(0, 5).map((r) => {
    const email = sanitizeDisplayText(
      r.contactEmail || 'misafir@turta.com.tr',
      80,
    );
    const nameSource = sanitizeDisplayText(
      r.customerName || email.split('@')[0] || 'M',
      60,
    );
    const initials = nameSource.slice(0, 2).toUpperCase();
    const created = new Date(r.createdAt);
    return {
      id: r.id,
      customerName: nameSource,
      customerEmail: email,
      customerInitials: initials,
      activity: sanitizeDisplayText(
        r.tourTitle || r.bookingNumber || 'Rezervasyon',
        80,
      ),
      activityType: r.tourId ? 'Tur' : 'Rezervasyon',
      date: created.toLocaleDateString('tr-TR'),
      time: created.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      amount: hideAmounts
        ? '—'
        : `${Number(r.totalAmount).toLocaleString('tr-TR')} ${sanitizeDisplayText(r.currency, 8)}`,
      status: statusLabel(r.status),
    };
  });
}

export function mapPopularTours(tours: PartnerTour[]): DashboardPopularTour[] {
  return tours.slice(0, 4).map((t) => ({
    id: t.id,
    title: sanitizeDisplayText(t.title, 80),
    location: sanitizeDisplayText(t.category || 'Türkiye', 40),
    rating: 0,
    reviewCount: 0,
    reservationCount: 0,
    guestCount: 0,
    price: `${Number(t.price).toLocaleString('tr-TR')} ${sanitizeDisplayText(t.currency, 8)}`,
    image: t.coverUrl || '/brand/mark-on-light.png',
  }));
}

export function countReservationStatuses(
  rows: PartnerReservation[],
): DashboardStatusCounts {
  const counts: DashboardStatusCounts = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };
  for (const r of rows) {
    if (r.status === 'CONFIRMED') counts.confirmed += 1;
    else if (r.status === 'CANCELLED') counts.cancelled += 1;
    else if (r.status === 'COMPLETED') counts.completed += 1;
    else counts.pending += 1;
  }
  return counts;
}

export function buildRevenueChart(
  months: Array<{ month: string; total: string }>,
  fallbackTotal: number,
): DashboardRevenueChartData {
  const monthPoints = months.map((m) => ({
    label: m.month.slice(5) || m.month,
    revenue: Number(m.total) || 0,
  }));
  return {
    week: monthPoints.slice(-2),
    month: monthPoints.length
      ? monthPoints
      : [{ label: 'Toplam', revenue: fallbackTotal }],
    year: monthPoints,
  };
}

export function monthOverMonthTrend(
  months: Array<{ month: string; total: string }>,
): { direction: 'up' | 'down' | 'neutral'; label: string } | undefined {
  if (months.length < 2) return undefined;
  const current = Number(months[months.length - 1]?.total) || 0;
  const previous = Number(months[months.length - 2]?.total) || 0;
  if (previous <= 0 && current <= 0) return undefined;
  if (previous <= 0) {
    return { direction: 'up', label: 'Yeni gelir' };
  }
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(delta));
  if (Math.abs(delta) < 0.5) {
    return { direction: 'neutral', label: 'Önceki aya göre sabit' };
  }
  return {
    direction: delta > 0 ? 'up' : 'down',
    label: `Önceki aya göre %${rounded}`,
  };
}
