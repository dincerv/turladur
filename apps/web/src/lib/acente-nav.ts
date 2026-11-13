import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Calendar,
  CircleHelp,
  ClipboardList,
  Cog,
  Globe,
  Home,
  MessageSquare,
  Users,
  Wallet,
} from 'lucide-react';

import type { PartnerNavPermission } from '@/lib/partner-route-access';
import { ACENTE_ROUTES } from '@/lib/panel-routes';

export type AcenteSidebarLink = {
  name: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** null = always; owner = acente sahibi; else staff permission key */
  permission: PartnerNavPermission;
};

/** Acente paneli sidebar — tek kaynak (DRY). */
export const ACENTE_SIDEBAR_LINKS: readonly AcenteSidebarLink[] = [
  {
    name: 'Genel Bakış',
    href: ACENTE_ROUTES.dashboard,
    icon: Home,
    permission: null,
  },
  {
    name: 'Turlar',
    href: ACENTE_ROUTES.tours,
    icon: Globe,
    permission: 'tours',
  },
  {
    name: 'Aktiviteler',
    href: ACENTE_ROUTES.experiences,
    icon: Globe,
    permission: 'tours',
  },
  {
    name: 'Rezervasyonlar',
    href: ACENTE_ROUTES.reservations,
    icon: Calendar,
    permission: 'reservations',
  },
  {
    name: 'Atamalar',
    href: ACENTE_ROUTES.assignments,
    icon: ClipboardList,
    description: 'Rehber / otobüs davetleri',
    permission: 'tours',
  },
  {
    name: 'Müşteriler',
    href: ACENTE_ROUTES.customers,
    icon: Users,
    permission: 'customers',
  },
  {
    name: 'Finansal Durum',
    href: ACENTE_ROUTES.financials,
    icon: Wallet,
    description: 'Gelir ve ödemeler',
    permission: 'reports',
  },
  {
    name: 'Raporlar',
    href: ACENTE_ROUTES.reports,
    icon: BarChart3,
    permission: 'reports',
  },
  {
    name: 'Kullanıcılar',
    href: ACENTE_ROUTES.users,
    icon: Users,
    permission: 'owner',
  },
  {
    name: 'Yorumlar',
    href: ACENTE_ROUTES.reviews,
    icon: MessageSquare,
    description: 'Müşteri değerlendirmeleri',
    permission: 'customers',
  },
  {
    name: 'Ayarlar',
    href: ACENTE_ROUTES.settings,
    icon: Cog,
    permission: 'owner',
  },
  {
    name: 'Yardım',
    href: ACENTE_ROUTES.help,
    icon: CircleHelp,
    description: 'Destek ve yardım',
    permission: null,
  },
] as const;
