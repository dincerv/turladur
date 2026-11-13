import { QuickAccessCard } from '@/components/features/partner-dashboard/quick-access-card';

import type { DashboardQuickAction } from './types';

type QuickActionsProps = {
  items: DashboardQuickAction[];
};

export function QuickActions({ items }: QuickActionsProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {items.map((item) => (
        <QuickAccessCard
          key={item.href}
          title={item.title}
          description={item.description}
          icon={item.icon}
          href={item.href}
          color={item.color}
        />
      ))}
    </div>
  );
}
