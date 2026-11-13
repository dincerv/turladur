import { BarChart3, Building2, Calendar, Clock, Wallet } from 'lucide-react';

import type { AcenteDashboardViewProps } from './acente-dashboard-view';

/** Visual QA fixture — no secrets, no live API. */
export const ACENTE_DASHBOARD_FIXTURE: AcenteDashboardViewProps = {
  name: 'Demo Acente',
  quickActions: [
    {
      title: 'Yeni Tur Ekle',
      description: 'Portföyünüze yeni bir tur ekleyin',
      icon: Building2,
      href: '/acente/tours/new',
      color: 'blue',
    },
    {
      title: 'Raporları İncele',
      description: 'Performans ve gelir özetlerini görün',
      icon: BarChart3,
      href: '/acente/reports',
      color: 'green',
    },
    {
      title: 'Rezervasyonları Yönet',
      description: 'Gelen rezervasyonları takip edin',
      icon: Calendar,
      href: '/acente/reservations',
      color: 'amber',
    },
  ],
  kpiCards: [
    {
      title: 'Toplam Tur',
      value: '12',
      icon: Building2,
      trend: { direction: 'up', label: '8 aktif yayın' },
    },
    {
      title: 'Toplam Rezervasyon',
      value: '48',
      icon: Calendar,
      trend: { direction: 'up', label: 'Kayıtlı rezervasyon' },
    },
    {
      title: 'Toplam Gelir',
      value: '186.450₺',
      icon: Wallet,
      trend: { direction: 'up', label: 'Önceki aya göre %12' },
    },
    {
      title: 'İncelemede',
      value: '2',
      icon: Clock,
      trend: { direction: 'down', label: 'Onay bekliyor' },
    },
  ],
  statusCounts: {
    pending: 5,
    confirmed: 28,
    cancelled: 3,
    completed: 12,
  },
  revenueChart: {
    week: [
      { label: '09', revenue: 12000 },
      { label: '10', revenue: 18500 },
    ],
    month: [
      { label: '05', revenue: 42000 },
      { label: '06', revenue: 51000 },
      { label: '07', revenue: 39000 },
      { label: '08', revenue: 62000 },
      { label: '09', revenue: 58000 },
      { label: '10', revenue: 71000 },
    ],
    year: [
      { label: '2024', revenue: 420000 },
      { label: '2025', revenue: 610000 },
    ],
  },
  recentReservations: [
    {
      id: '1',
      customerName: 'Ayşe Yılmaz',
      customerEmail: 'ayse@ornek.com',
      customerInitials: 'AY',
      activity: 'Kapadokya Balon ve Vadiler Turu',
      activityType: 'Tur',
      date: '12.11.2026',
      time: '14:20',
      amount: '4.500 TRY',
      status: 'Onaylandı',
    },
    {
      id: '2',
      customerName: 'Mehmet Kaya',
      customerEmail: 'mehmet@ornek.com',
      customerInitials: 'MK',
      activity: 'Antalya Günübirlik Tekne',
      activityType: 'Tur',
      date: '12.11.2026',
      time: '11:05',
      amount: '1.200 TRY',
      status: 'Beklemede',
    },
    {
      id: '3',
      customerName: 'Zeynep Demir',
      customerEmail: 'zeynep@ornek.com',
      customerInitials: 'ZD',
      activity: 'İstanbul Boğaz Turu',
      activityType: 'Tur',
      date: '11.11.2026',
      time: '09:40',
      amount: '900 TRY',
      status: 'İptal Edildi',
    },
  ],
  popularTours: [
    {
      id: 't1',
      title: 'Kapadokya Klasik Rota',
      location: 'Nevşehir',
      rating: 4.8,
      reviewCount: 24,
      reservationCount: 18,
      guestCount: 54,
      price: '4.500 TRY',
      image: '/brand/mark-on-light.png',
    },
    {
      id: 't2',
      title: 'Ege Kıyıları Haftalık',
      location: 'İzmir',
      rating: 4.6,
      reviewCount: 11,
      reservationCount: 9,
      guestCount: 30,
      price: '12.900 TRY',
      image: '/brand/mark-on-light.png',
    },
  ],
};
