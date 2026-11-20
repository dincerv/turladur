'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

import { NotificationBell } from '@/components/layout/notification-bell';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin/dashboard', label: 'Özet' },
  { href: '/admin/statistics', label: 'İstatistik' },
  { href: '/admin/reservations', label: 'Rezervasyonlar' },
  { href: '/admin/users', label: 'Kullanıcılar' },
  { href: '/admin/agencies', label: 'Partner / Acente' },
  { href: '/admin/guides', label: 'Rehberler' },
  { href: '/admin/tours', label: 'Onay' },
  { href: '/admin/reviews', label: 'Yorumlar' },
  { href: '/admin/content', label: 'İçerik Yönetimi' },
];

/** Align with middleware ADMIN_ROLES — access token is memory-only until boot refresh. */
const ADMIN_ROLES = new Set([
  'ADMIN',
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PLATFORM_SUPER_ADMIN',
]);

/** Admin shell — separate from marketing. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout, accessToken, isBootstrapping } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (user && !ADMIN_ROLES.has(user.role)) {
      router.replace('/');
    }
  }, [isBootstrapping, accessToken, user, router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (isBootstrapping || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-600">
        Yönlendiriliyor…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 [&_a]:cursor-pointer [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_[role=button]]:cursor-pointer">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-900 text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-neutral-200 hover:bg-white/10 md:hidden"
              aria-label={navOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              onClick={() => setNavOpen((v) => !v)}
            >
              {navOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link href="/admin/dashboard" className="font-semibold text-white">
              turta Admin
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <NotificationBell solid={false} />
            <span className="hidden text-neutral-300 sm:inline">
              {user?.email}
            </span>
            <Link
              href="/"
              className="hidden text-neutral-400 hover:text-white sm:inline"
            >
              Site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-neutral-950 px-3 py-1.5 text-white hover:bg-neutral-800"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr] md:py-8">
        <nav
          className={cn(
            'flex-col gap-1 md:flex',
            navOpen ? 'flex' : 'hidden md:flex',
          )}
        >
          <div className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 text-sm font-medium',
                  pathname.startsWith(item.href)
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100',
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
