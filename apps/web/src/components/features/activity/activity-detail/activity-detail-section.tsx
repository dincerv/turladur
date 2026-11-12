import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActivityDetailSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function ActivityDetailSection({
  id,
  title,
  icon: Icon,
  children,
  className,
}: ActivityDetailSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'scroll-mt-24 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <h2
        id={headingId}
        className="mb-4 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl"
      >
        <span
          aria-hidden
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"
        >
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
