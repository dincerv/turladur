import type { ElementType } from 'react';

export type DashboardReservationStatus =
  | 'Onaylandı'
  | 'Beklemede'
  | 'İptal Edildi'
  | 'Tamamlandı'
  | 'Ödeme Bekliyor'
  | 'Askıya Alındı';

export type DashboardRecentReservation = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerInitials: string;
  activity: string;
  activityType: string;
  date: string;
  time: string;
  amount: string;
  status: DashboardReservationStatus;
};

export type DashboardPopularTour = {
  id: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  reservationCount: number;
  guestCount: number;
  price: string;
  image: string;
};

export type DashboardKpiTrend = {
  direction: 'up' | 'down' | 'neutral';
  label: string;
};

export type DashboardKpiCard = {
  title: string;
  value: string;
  icon: ElementType;
  trend?: DashboardKpiTrend;
  hint?: string;
};

export type DashboardQuickAction = {
  title: string;
  description: string;
  icon: ElementType;
  href: string;
  color: 'blue' | 'green' | 'amber';
};

export type DashboardRevenuePoint = {
  label: string;
  revenue: number;
};

export type DashboardRevenueChartData = {
  week: DashboardRevenuePoint[];
  month: DashboardRevenuePoint[];
  year: DashboardRevenuePoint[];
};

export type DashboardStatusCounts = {
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
};
