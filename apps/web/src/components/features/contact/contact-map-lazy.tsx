'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

function ContactMapSkeleton() {
  return (
    <div
      className="flex h-full min-h-[280px] w-full items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-100 shadow-md"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-2 text-neutral-400">
        <MapPin className="h-8 w-8 animate-pulse" />
        <span className="text-xs font-medium">Harita yükleniyor…</span>
      </div>
    </div>
  );
}

const ContactMap = dynamic(() => import('./contact-map'), {
  ssr: false,
  loading: ContactMapSkeleton,
});

export function ContactMapLazy() {
  return <ContactMap />;
}
