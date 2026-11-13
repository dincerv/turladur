import type {
  PartnerDashboardPopularTour,
  PartnerDashboardRecentReservation,
  PartnerDashboardStatusCounts,
} from '@/services/partner-admin';

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
    case 'PAYMENT_FAILED':
    case 'EXPIRED':
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
  rows: PartnerDashboardRecentReservation[],
  hideAmounts = false,
): DashboardRecentReservation[] {
  return rows.slice(0, 5).map((r) => {
    const email = sanitizeDisplayText(
      r.contactEmail || 'misafir@turta.com.tr',
      80,
    );
    const rawName = sanitizeDisplayText(r.customerName || '', 60);
    const nameSource =
      rawName && rawName.toLowerCase() !== email.toLowerCase()
        ? rawName
        : sanitizeDisplayText(email.split('@')[0] || 'Misafir', 60);
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
      date: Number.isNaN(created.getTime())
        ? '—'
        : created.toLocaleDateString('tr-TR'),
      time: Number.isNaN(created.getTime())
        ? '—'
        : created.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
      amount: hideAmounts
        ? '—'
        : `${Number(r.totalAmount || 0).toLocaleString('tr-TR')} ${sanitizeDisplayText(r.currency || 'TRY', 8)}`,
      status: statusLabel(r.status),
    };
  });
}

export function mapPopularTours(
  tours: PartnerDashboardPopularTour[],
): DashboardPopularTour[] {
  return tours.slice(0, 4).map((t) => ({
    id: t.id,
    title: sanitizeDisplayText(t.title, 80),
    location: sanitizeDisplayText(t.category || 'Türkiye', 40),
    rating: Number(t.rating) || 0,
    reviewCount: Number(t.reviewCount) || 0,
    reservationCount: Number(t.reservationCount) || 0,
    guestCount: Number(t.guestCount) || 0,
    price: `${Number(t.price || 0).toLocaleString('tr-TR')} ${sanitizeDisplayText(t.currency || 'TRY', 8)}`,
    image: t.coverUrl || '/brand/mark-on-light.png',
  }));
}

export function toStatusCounts(
  byStatus: PartnerDashboardStatusCounts | null | undefined,
): DashboardStatusCounts {
  return {
    pending: byStatus?.pending ?? 0,
    confirmed: byStatus?.confirmed ?? 0,
    cancelled: byStatus?.cancelled ?? 0,
    completed: byStatus?.completed ?? 0,
  };
}

export function buildRevenueChart(
  months: Array<{ month: string; total: string }> | null | undefined,
  fallbackTotal: number,
): DashboardRevenueChartData {
  const safeMonths = Array.isArray(months) ? months : [];
  const monthPoints = safeMonths.map((m) => ({
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

/**
 * MoM for the lifetime revenue KPI.
 * Skip when the current calendar month is empty — otherwise the card
 * mixes lifetime total with a misleading monthly delta.
 */
export function monthOverMonthTrend(
  months: Array<{ month: string; total: string }> | null | undefined,
): { direction: 'up' | 'down' | 'neutral'; label: string } | undefined {
  if (!months || months.length < 2) return undefined;
  const current = Number(months[months.length - 1]?.total) || 0;
  const previous = Number(months[months.length - 2]?.total) || 0;
  if (current <= 0) return undefined;
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
